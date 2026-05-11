import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "قصتنا — Hedma هدمة" },
      { name: "description", content: "قصة Hedma هدمة من التل الكبير. ماركة محلية بتقدّم أحدث الموديلات بأسعار مناسبة." },
      { property: "og:title", content: "قصتنا — Hedma هدمة" },
      { property: "og:description", content: "قصة Hedma هدمة من التل الكبير. ماركة محلية بتقدّم أحدث الموديلات بأسعار مناسبة." },
    ],
  }),
  component: OurStory,
});

function OurStory() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl md:text-5xl font-black text-center mb-2">
        قصة <span className="text-gold-gradient">هدمة</span>
      </h1>
      <p className="text-center text-muted-foreground mb-12">من التل الكبير 🇪🇬 إلى كل بيت في مصر</p>

      <div className="prose prose-lg max-w-none space-y-6 text-foreground/90 leading-loose">
        <p>
          بدأت <strong>هدمة</strong> من فكرة بسيطة: ليه ساكن التل الكبير ميلاقيش نفس الموضة اللي
          بتتوزّع في وسط البلد؟ ليه يدفع أكتر عشان يجيب لبس عصري؟ من هنا اتولدت <em>هدمة</em>.
        </p>
        <p>
          إحنا ماركة محلية ١٠٠٪، بنختار كل قطعة بإيدينا، بنتأكد من الخامات، وبنوصلهالك بسعر
          يناسب جيب الشاب والبنت المصرية. هدفنا مش بس البيع، إحنا عايزين كل واحد لابس هدمة يحس
          بثقة وأناقة.
        </p>
        <p>
          أول ميزة في الموقع وهي <strong>تجربة اللبس بالذكاء الاصطناعي</strong> جت من سؤال بسيط:
          إزاي أعرف اللبس ده هيبقى عليّ شكله إيه قبل ما أدفع؟ من هنا اشتغلنا على تكنولوجيا
          بتوريك صورتك لابس المنتج، عشان تشتري وأنت مرتاح.
        </p>
        <h2 className="font-display text-2xl font-bold pt-4">قيمنا</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>محلي وفخور</strong> — كل الفريق وكل المنتجات من مصر.</li>
          <li><strong>جودة قبل الكمية</strong> — قطع منتقاة، مش كتالوج عشوائي.</li>
          <li><strong>سعر صادق</strong> — مفيش مبالغة، السعر زي ما أنت شايفه.</li>
          <li><strong>دعم على واتساب</strong> — لو احتجت أي حاجة، إحنا موجودين.</li>
        </ul>
        <p className="pt-4 text-center">
          شكراً إنك جزء من رحلتنا 🌟
        </p>
      </div>

      <div className="mt-12 text-center">
        <Link to="/products" className="inline-flex items-center justify-center gradient-gold text-primary font-bold px-6 py-3 rounded-xl shadow-luxe">
          اتفرّج على المنتجات
        </Link>
      </div>
    </article>
  );
}
