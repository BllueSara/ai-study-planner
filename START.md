# كيفية تشغيل النظام

## الخطوة 1: إعداد Supabase

1. أنشئ مشروع جديد على [Supabase](https://supabase.com)
2. انسخ `SUPABASE_URL` و `SUPABASE_ANON_KEY` من إعدادات المشروع
3. نفذ ملف `supabase-schema.sql` في SQL Editor في Supabase Dashboard

## الخطوة 2: تثبيت التبعيات

```bash
npm install
```

## الخطوة 3: إعداد متغيرات البيئة

أنشئ ملف `.env` في المجلد الرئيسي:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## الخطوة 4: تشغيل التطبيق

```bash
npm run dev
```

سترى رسالة:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:4000/
```

## الخطوة 5: فتح المتصفح

افتح المتصفح واذهب إلى:
```
http://localhost:4000
```

## الخطوة 6: استخدام Study Sessions

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

- **لا حاجة لخادم منفصل** - كل شيء يعمل من خلال Supabase
- Frontend يعمل على المنفذ **4000**
- تأكد من إعداد Supabase بشكل صحيح قبل التشغيل
- تأكد من تفعيل Realtime في Supabase Dashboard
