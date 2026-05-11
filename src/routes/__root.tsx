import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/Header";
import { PromoBar } from "@/components/PromoBar";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-gold-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">الرابط ده مش متاح أو اتنقل.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md gradient-gold text-primary px-5 py-2 text-sm font-bold">
            للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">حصل خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted-foreground">جرّب تحدّث الصفحة أو ارجع للرئيسية.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md gradient-gold text-primary px-4 py-2 text-sm font-bold">حاول تاني</button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm">للرئيسية</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hedma | هدمة - أناقة عصرية" },
      { name: "description", content: "Hedma هدمة - متجر ملابس عصري بأحدث الموديلات في التل الكبير . تيشيرتات، بناطيل، كوتشيات، إكسسوارات. جرّب اللبس بالذكاء الاصطناعي قبل ما تشتري." },
      { property: "og:title", content: "Hedma | هدمة - أناقة عصرية" },
      { property: "og:description", content: "Hedma هدمة - متجر ملابس عصري بأحدث الموديلات في التل الكبير . تيشيرتات، بناطيل، كوتشيات، إكسسوارات. جرّب اللبس بالذكاء الاصطناعي قبل ما تشتري." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Hedma | هدمة - أناقة عصرية" },
      { name: "twitter:description", content: "Hedma هدمة - متجر ملابس عصري بأحدث الموديلات في التل الكبير . تيشيرتات، بناطيل، كوتشيات، إكسسوارات. جرّب اللبس بالذكاء الاصطناعي قبل ما تشتري." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0cb31ece-aea9-43bb-be67-f370c46c6b65/id-preview-3daf2b8f--8c743c40-e4cc-4796-8885-804baf17e779.lovable.app-1778421574580.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0cb31ece-aea9-43bb-be67-f370c46c6b65/id-preview-3daf2b8f--8c743c40-e4cc-4796-8885-804baf17e779.lovable.app-1778421574580.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <PromoBar />
            <Header />
            <main className="flex-1"><Outlet /></main>
            <Footer />
          </div>
          <FloatingWhatsApp />
          <Toaster richColors position="top-center" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
