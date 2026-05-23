import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider, useAuth as useAuthCtx } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/Header";
import { PromoBar } from "@/components/PromoBar";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { SocialProofPopup } from "@/components/SocialProofPopup";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useSiteSettings } from "@/lib/settings";
import { useEffect, useState, useRef } from "react";

import appCss from "../styles.css?url";

function BrandingMeta() {
  const s = useSiteSettings();

  useEffect(() => {
    if (!s) return;
    
    // Update Title
    const title = s.slogan ? `Hedma | ${s.slogan}` : "Hedma | هدمة - أناقة عصرية";
    document.title = title;

    // Update Favicon
    if (s.logo_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = s.logo_url;
    }

    // Update Meta Tags (OG)
    const metaTags = {
      "og:title": title,
      "og:image": s.logo_url || "",
      "twitter:title": title,
      "twitter:image": s.logo_url || "",
    };

    Object.entries(metaTags).forEach(([prop, val]) => {
      if (!val) return;
      const selector = prop.startsWith("og:") ? `meta[property='${prop}']` : `meta[name='${prop}']`;
      const el = document.querySelector(selector);
      if (el) el.setAttribute("content", val);
    });
  }, [s]);

  return null;
}

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

/* [2] Silent auto-retry error component — no manual "حاول تاني" button */
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    console.error("[Hedma] Error caught:", error);

    if (retryCount.current < maxRetries) {
      retryCount.current += 1;
      const timer = setTimeout(() => {
        router.invalidate();
        reset();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [error, reset, router]);

  // While retrying silently, show a loading spinner
  if (retryCount.current < maxRetries) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto size-10 border-4 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">جاري إعادة المحاولة...</p>
        </div>
      </div>
    );
  }

  // After max retries exhausted, show a simple message with a home link (no manual retry)
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center space-y-4">
        <div className="mx-auto size-16 rounded-full bg-muted grid place-items-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-bold">عذراً، حدثت مشكلة</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          لم نتمكن من تحميل الصفحة. يرجى التحقق من اتصالك بالإنترنت.
        </p>
        <a href="/" className="inline-flex items-center justify-center rounded-xl gradient-gold text-primary px-6 py-2.5 text-sm font-bold shadow-luxe">
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
{
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

/* [1] Fixed AuthGuard — no longer forces redirect for public pages; 
   the auth route renders without chrome. All other pages get full layout. */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthCtx();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isAuthRoute = path === "/auth";

  // Public routes that don't need authentication
  const publicRoutes = ["/", "/products", "/our-story", "/customers", "/try-on", "/wishlist"];
  const isPublicRoute = publicRoutes.some(r => path === r || path.startsWith("/product/") || path.startsWith("/track/"));

  useEffect(() => {
    if (loading) return;
    // Only redirect to auth for protected routes when not logged in
    if (!session && !isAuthRoute && !isPublicRoute) {
      router.navigate({ to: "/auth", replace: true });
    }
  }, [session, loading, isAuthRoute, isPublicRoute, router]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-center space-y-3">
          <div className="mx-auto size-8 border-4 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-gold-gradient animate-pulse">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!session && isAuthRoute) {
    // Render only the auth page, no chrome
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
        <PromoBar />
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </div>
      <FloatingWhatsApp />
      <SocialProofPopup />
      <NotificationPrompt />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="hedma-theme">
        <AuthProvider>
          <CartProvider>
            <BrandingMeta />
            <AuthGuard>
              <Outlet />
            </AuthGuard>
            <Toaster richColors position="top-center" />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
