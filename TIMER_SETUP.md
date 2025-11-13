# إعداد التايمر المشترك (Shared Timer)

## الوضع الحالي

التايمر الحالي يستخدم `localStorage` للمزامنة البسيطة. هذا يعني:
- ✅ يعمل بدون إعداد إضافي
- ⚠️ المزامنة محدودة (تعمل فقط بين التبويبات في نفس المتصفح)
- ⚠️ لا تعمل المزامنة بين مستخدمين مختلفين على أجهزة مختلفة

## للمزامنة الحقيقية بين جميع المستخدمين

لجعل التايمر يعمل بين جميع المستخدمين (على أجهزة مختلفة)، تحتاج إلى إعداد **Firebase Realtime Database**.

### الخطوات:

#### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد
3. أضف **Realtime Database** إلى مشروعك
4. اختر وضع "Test mode" للبداية

#### 2. تثبيت Firebase

```bash
npm install firebase
```

#### 3. إنشاء ملف الإعداد

أنشئ ملف `src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

#### 4. تحديث StudyTimer.jsx

استبدل دالة `syncTimerState` و `useEffect` في `StudyTimer.jsx`:

```javascript
import { ref, set, onValue, serverTimestamp } from 'firebase/database';
import { database } from '../config/firebase';

// في handleStart:
const timerRef = ref(database, `timers/${planId}`);
set(timerRef, {
  running: true,
  time: elapsed,
  startTime: startTimeRef.current,
  timestamp: serverTimestamp()
});

// في useEffect:
useEffect(() => {
  if (isShared && planId) {
    const timerRef = ref(database, `timers/${planId}`);
    
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // تحديث التايمر بناءً على البيانات من Firebase
        if (data.running && !isRunning) {
          // مستخدم آخر بدأ التايمر
          handleStart();
        }
        // ... باقي المنطق
      }
    });

    return () => unsubscribe();
  }
}, [isShared, planId]);
```

## بدائل أخرى

### 1. WebSocket Server
يمكنك استخدام WebSocket server (Node.js + Socket.io) للمزامنة.

### 2. Supabase Realtime
بديل مجاني لـ Firebase مع Realtime subscriptions.

### 3. Pusher
خدمة مدفوعة للمزامنة في الوقت الفعلي.

## ملاحظات

- الحل الحالي (localStorage) مناسب للاختبار والتطوير
- للمزامنة الحقيقية بين المستخدمين، Firebase هو الأسهل والأسرع
- تأكد من إعداد قواعد الأمان في Firebase بشكل صحيح

