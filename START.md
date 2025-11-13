# كيفية تشغيل النظام

## الخطوة 1: تثبيت التبعيات

### Frontend (الواجهة الأمامية):
```bash
npm install
```

### Backend (الخادم):
```bash
cd server
npm install
cd ..
```

## الخطوة 2: تشغيل الخوادم

تحتاج لفتح **ترمينالين** منفصلين:

### Terminal 1 - Backend Server (الخادم):
```bash
cd server
npm run dev
```

سترى رسالة:
```
Server running on port 3001
Socket.io server ready
```

### Terminal 2 - Frontend (الواجهة):
```bash
npm run dev
```

سترى رسالة:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:4000/
```

## الخطوة 3: فتح المتصفح

افتح المتصفح واذهب إلى:
```
http://localhost:4000
```

## الخطوة 4: استخدام Study Sessions

1. اضغط على زر **"Study Sessions"** في الصفحة الرئيسية
2. أو اذهب مباشرة إلى: `http://localhost:4000/sessions`

## إنشاء جلسة (Leader):

1. اضغط "Create Session"
2. أدخل:
   - اسمك
   - اسم الجلسة
   - المدة (30 دقيقة، ساعة، ساعتين)
3. اضغط "Create Session"
4. **انسخ Session ID** وشاركه مع الآخرين

## الانضمام لجلسة (Participant):

1. اضغط "Join Session"
2. أدخل:
   - اسمك
   - Session ID (من الـ Leader)
3. اضغط "Join Session"
4. ستشاهد الـ Timer والـ Leaderboard مباشرة

## ملاحظات مهمة:

- **يجب تشغيل الخادمين معاً** (Backend + Frontend)
- Backend يعمل على المنفذ **3001**
- Frontend يعمل على المنفذ **4000**
- إذا لم يعمل، تأكد من تثبيت التبعيات أولاً

