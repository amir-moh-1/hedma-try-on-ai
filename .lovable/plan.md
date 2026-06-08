الطلب ضخم جداً (6 ممزات + إعادة تصميم بثيمين كاملين). هنفذه على مراحل في نفس الجلسة عشان نضمن إن كل حاجة شغالة وما نكسرش الموقع.

## المرحلة 1: إصلاحات حرجة (أولاً)

**أ. ثبات الجلسة (Session Persistence) — البند 5**
- مراجعة `src/lib/auth.tsx` و `src/routes/__root.tsx`
- التأكد من إن `supabase.auth` بيستخدم `localStorage` بشكل صحيح (مفعّل افتراضياً)
- إزالة أي `signOut()` تلقائي عند الـ refresh
- حفظ آخر route في `localStorage` (`hedma:last_route`) — موجود بالفعل
- منع redirect قسري للـ `/auth` إلا للصفحات المحمية فعلاً
- التأكد من إن السلة (`cart.tsx`) والـ wishlist بيتخزنوا في localStorage

**ب. استقرار الـ AI — البند 4**
- مراجعة `supabase/functions/ai-tryon/index.ts` والـ try-on route
- إضافة timeout + retry logic + error boundaries
- loading states واضحة + رسائل خطأ مفهومة
- منع الـ infinite polling

**ج. OTP بالإيميل — البند 3**
- إنشاء edge function `send-otp-email` يولّد كود 6 أرقام ويبعته بالإيميل (عبر `send-email` الموجودة)
- جدول `otp_codes` في DB للتحقق
- إزالة أي عرض للـ OTP على الشاشة
- زر "إعادة الإرسال" مع مؤقت 60 ثانية
- دمجها في صفحة `auth.tsx`

## المرحلة 2: ميزات جديدة

**د. مساعد التسوق الذكي (AI Shopping Assistant) — البند 1**
- مكوّن `src/components/AIShoppingAssistant.tsx` كـ floating chat
- edge function `ai-shop-assistant` تستخدم Lovable AI (`google/gemini-3-flash-preview`) + tool calling
- الـ tool: `search_products(category?, max_price?, color?, size?)` يقرأ من جدول `products`
- يعرض كروت منتجات داخل المحادثة
- conversation history في localStorage (محادثة واحدة)

**هـ. إعادة هيكلة الجرد لكل تاجر — البند 2**
- تحديث `src/components/admin/SmartInventoryTab.tsx`:
  - tabs/accordion لكل تاجر منفصل
  - sorting داخل كل تاجر (تاريخ الإضافة / المخزون)
  - عرض إجمالي قيمة المخزون لكل تاجر

## المرحلة 3: التسجيل + الثيمين

**و. التسجيل المتقدم — البند 6 (جزء 1)**
- حقل العمر (إلزامي)
- country code picker للهاتف (افتراضي +20 مصر) مع validation
- فحص username uniqueness أثناء الكتابة + اقتراح بدائل من الاسم الفعلي

**ز. نظام الثيمين — البند 6 (جزء 2)**
- حسب اختيارك: **تبديل يدوي في الهيدر** (مش حسب العمر تلقائياً)
- ثيم "شبابي" (Youth): أسود + أخضر نيون (#CCFF00) — مرجع الصور 1, 2
- ثيم "بريميوم" (Premium): بيج/كاريميل + خط Serif أنيق — مرجع الصور 3, 4
- الثيم الافتراضي حسب العمر: ≤25 شبابي، >25 بريميوم
- بعد التسجيل: الثيم يتثبت حسب العمر لكن يقدر يبدّله من الهيدر (يتحفظ في localStorage)
- Admin: ثيم موحّد مستقل (مش متأثر)
- تنفيذ عبر CSS variables في `src/styles.css` + `data-theme` attribute على `<html>`
- تحسين الـ mobile responsiveness للثيمين

## ملاحظات تقنية

- إرسال OTP بالإيميل هيستخدم edge function `send-email` الموجودة حالياً (لازم تكون شغالة)
- مش هتعدّل في `_authenticated/route.tsx` (مُدار من Lovable)
- الـ AI Assistant هيحتاج `LOVABLE_API_KEY` (موجود فعلاً ✅)
- إعادة التصميم بثيمين هتمس معظم المكونات الرئيسية (Header, ProductCard, Hero, etc.) — هنحافظ على الـ structure ونغيّر التوكنز فقط قدر الإمكان
- migration واحدة في البداية لإضافة: جدول `otp_codes`, عمود `age` في `profiles`, عمود `vendor_id` index على `products` (لو محتاج)

## المخاطر

- الشغل ده كبير جداً ومتوقع ياخد عدة turns. لو حصل error في أي مرحلة هنوقف ونصلح قبل ما نكمّل.
- إعادة التصميم بثيمين ممكن تأثر على صفحات موجودة — هنختبر بصرياً بعد كل مرحلة.
- لو ميزانية الـ AI Gateway قربت تخلص، المساعد الذكي ممكن يفصل (هنعرض رسالة خطأ واضحة).

**موافق على الخطة دي؟** بعد ما توافق، هبدأ تنفيذ المرحلة 1 (الإصلاحات الحرجة) فوراً.