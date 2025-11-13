import { supabase, generateSessionId } from './supabase';

// Create a new study session
export const createSession = async (sessionName, duration, leaderName) => {
  const sessionId = generateSessionId();
  const userId = crypto.randomUUID(); // Generate unique user ID for this client

  // Create session in database
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      session_name: sessionName,
      leader_id: userId,
      leader_name: leaderName,
      duration: duration,
      remaining_time: duration,
      status: 'waiting',
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    .select()
    .single();

  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`);
  }

  // Add leader as first participant
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .insert({
      session_id: sessionId,
      user_id: userId,
      name: leaderName,
      joined_at: Date.now(),
      status: 'active',
      time_spent: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    .select()
    .single();

  if (participantError) {
    // If participant insert fails, try to delete the session
    await supabase.from('sessions').delete().eq('id', sessionId);
    throw new Error(`Failed to add leader: ${participantError.message}`);
  }

  return {
    sessionId,
    userId,
    session: {
      ...session,
      isLeader: true,
    },
  };
};

// Join an existing session
export const joinSession = async (sessionId, participantName) => {
  const normalizedSessionId = sessionId?.toUpperCase().trim();
  if (!normalizedSessionId) {
    throw new Error('Invalid session ID');
  }

  // Check if session exists
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', normalizedSessionId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found');
  }

  if (session.status === 'ended') {
    throw new Error('Session has ended');
  }

  const normalizedName = participantName?.trim();
  if (!normalizedName) {
    throw new Error('Invalid participant name');
  }

  // Check if user is the leader (by name) for reconnection
  const isLeaderReconnect = session.leader_name?.toLowerCase().trim() === normalizedName.toLowerCase();
  const userId = isLeaderReconnect ? session.leader_id : crypto.randomUUID();

  // Check if participant already exists (by name)
  const { data: existingParticipants } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', normalizedSessionId)
    .ilike('name', normalizedName);

  if (existingParticipants && existingParticipants.length > 0) {
    // Update existing participant (reconnection)
    const existingParticipant = existingParticipants[0];
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('participants')
      .update({
        user_id: userId,
        status: 'active',
        updated_at: Date.now(),
      })
      .eq('id', existingParticipant.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to reconnect: ${updateError.message}`);
    }

    // Update leader_id if it's a leader reconnection
    if (isLeaderReconnect) {
      await supabase
        .from('sessions')
        .update({ leader_id: userId, updated_at: Date.now() })
        .eq('id', normalizedSessionId);
    }

    return {
      sessionId: normalizedSessionId,
      userId,
      session: {
        ...session,
        isLeader: session.leader_id === userId,
      },
    };
  }

  // Add new participant
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .insert({
      session_id: normalizedSessionId,
      user_id: userId,
      name: normalizedName,
      joined_at: Date.now(),
      status: 'active',
      time_spent: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    .select()
    .single();

  if (participantError) {
    throw new Error(`Failed to join session: ${participantError.message}`);
  }

  return {
    sessionId: normalizedSessionId,
    userId,
    session: {
      ...session,
      isLeader: session.leader_id === userId,
    },
  };
};

// Get session data
export const getSession = async (sessionId) => {
  const normalizedSessionId = sessionId?.toUpperCase().trim();
  if (!normalizedSessionId) {
    throw new Error('Invalid session ID');
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', normalizedSessionId)
    .single();

  if (error || !session) {
    throw new Error('Session not found');
  }

  return session;
};

// Get participants for a session
export const getParticipants = async (sessionId) => {
  const normalizedSessionId = sessionId?.toUpperCase().trim();
  if (!normalizedSessionId) {
    return [];
  }

  const { data: participants, error } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', normalizedSessionId)
    .eq('status', 'active')
    .order('time_spent', { ascending: false });

  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }

  // Calculate leaderboard with ranks
  return participants.map((p, index) => ({
    userId: p.user_id,
    name: p.name,
    joinedAt: p.joined_at,
    status: p.status,
    timeSpent: p.time_spent || 0,
    rank: index + 1,
  }));
};

// Update session status (timer controls)
export const updateSessionStatus = async (sessionId, updates) => {
  const normalizedSessionId = sessionId?.toUpperCase().trim();
  if (!normalizedSessionId) {
    throw new Error('Invalid session ID');
  }

  const { data, error } = await supabase
    .from('sessions')
    .update({
      ...updates,
      updated_at: Date.now(),
    })
    .eq('id', normalizedSessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }

  return data;
};

// Start timer
export const startTimer = async (sessionId, userId) => {
  const session = await getSession(sessionId);
  
  // Verify user is leader
  if (session.leader_id !== userId) {
    throw new Error('Unauthorized: Only the leader can control the timer');
  }

  const now = Date.now();
  let startTime = session.start_time;
  let pausedDuration = session.paused_duration || 0;

  if (session.status === 'paused') {
    // Resume from pause
    pausedDuration += now - (session.paused_at || now);
  } else {
    // Start fresh
    startTime = now;
    pausedDuration = 0;
  }

  return await updateSessionStatus(sessionId, {
    status: 'active',
    start_time: startTime,
    paused_at: null,
    paused_duration: pausedDuration,
  });
};

// Pause timer
export const pauseTimer = async (sessionId, userId) => {
  const session = await getSession(sessionId);
  
  if (session.leader_id !== userId) {
    throw new Error('Unauthorized: Only the leader can control the timer');
  }

  if (session.status !== 'active') {
    throw new Error('Timer is not active');
  }

  // Calculate remaining time at pause
  const now = Date.now();
  const startTime = session.start_time;
  const pausedDuration = session.paused_duration || 0;
  const elapsed = Math.floor((now - startTime - pausedDuration) / 1000);
  const remainingTime = Math.max(0, session.duration - elapsed);

  return await updateSessionStatus(sessionId, {
    status: 'paused',
    paused_at: now,
    remaining_time: remainingTime,
  });
};

// Reset timer
export const resetTimer = async (sessionId, userId) => {
  const session = await getSession(sessionId);
  
  if (session.leader_id !== userId) {
    throw new Error('Unauthorized: Only the leader can control the timer');
  }

  return await updateSessionStatus(sessionId, {
    status: 'waiting',
    remaining_time: session.duration,
    start_time: null,
    paused_at: null,
    paused_duration: 0,
  });
};

// End session
export const endSession = async (sessionId, userId) => {
  const session = await getSession(sessionId);
  
  if (session.leader_id !== userId) {
    throw new Error('Unauthorized: Only the leader can end the session');
  }

  // Update session status
  await updateSessionStatus(sessionId, {
    status: 'ended',
    remaining_time: 0,
  });

  // Update all active participants to completed
  await supabase
    .from('participants')
    .update({ status: 'completed', updated_at: Date.now() })
    .eq('session_id', sessionId)
    .eq('status', 'active');
};

// Update participant status
export const updateParticipantStatus = async (sessionId, userId, status) => {
  const normalizedSessionId = sessionId?.toUpperCase().trim();
  if (!normalizedSessionId) return;

  await supabase
    .from('participants')
    .update({ status, updated_at: Date.now() })
    .eq('session_id', normalizedSessionId)
    .eq('user_id', userId);
};

// Update participant time spent
export const updateParticipantTime = async (sessionId, userId, timeSpent) => {
  const normalizedSessionId = sessionId?.toUpperCase().trim();
  if (!normalizedSessionId) return;

  await supabase
    .from('participants')
    .update({ time_spent: timeSpent, updated_at: Date.now() })
    .eq('session_id', normalizedSessionId)
    .eq('user_id', userId);
};

// Subscribe to session updates
export const subscribeToSession = (sessionId, callback) => {
  const normalizedSessionId = sessionId?.toUpperCase().trim();
  if (!normalizedSessionId) return null;

  const channel = supabase
    .channel(`session:${normalizedSessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${normalizedSessionId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
};

// Subscribe to participants updates
export const subscribeToParticipants = (sessionId, callback) => {
  const normalizedSessionId = sessionId?.toUpperCase().trim();
  if (!normalizedSessionId) return null;

  const channel = supabase
    .channel(`participants:${normalizedSessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${normalizedSessionId}`,
      },
      async (payload) => {
        // Fetch updated leaderboard
        const participants = await getParticipants(normalizedSessionId);
        callback(participants);
      }
    )
    .subscribe();

  return channel;
};

// Unsubscribe from channel
export const unsubscribe = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

