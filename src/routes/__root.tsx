import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { StorefrontThemeProvider } from "@/lib/storefront-theme";
import { Header } from "@/components/Header";
import { PromoBar } from "@/components/PromoBar";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { SocialProofPopup } from "@/components/SocialProofPopup";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { AIShoppingAssistant } from "@/components/AIShoppingAssistant";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useSiteSettings } from "@/lib/settings";
import { useEffect } from "react";

import appCss from "../styles.css?url";


function BrandingMeta() {
  const s = useSiteSettings();

  useEffect(() => {
    if (!s) return;
    
    const title = s.slogan ? `Hedma | ${s.slogan}` : "Hedma | هدمة - أناقة عصرية";
    document.title = title;

    if (s.logo_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = s.logo_url;
    }

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[Hedma] Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="text-center space-y-5 max-w-sm">
        <div className="text-5xl">😓</div>
        <h2 className="text-xl font-black">حصل خطأ مؤقت</h2>
        <p className="text-sm text-muted-foreground">اضغط إعادة المحاولة أو اذهب للرئيسية</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 gradient-gold text-primary text-sm font-bold rounded-xl"
          >
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.replace("/")}
            className="px-5 py-2.5 bg-muted text-sm font-bold rounded-xl"
          >
            للرئيسية
          </button>
        </div>
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
      { name: "description", content: "Hedma هدمة - متجر ملابس عصري بأحدث الموديلات في التل الكبير . تيشيرتات، بناطيل، كوتشيات، [...]" },
      { property: "og:title", content: "Hedma | هدمة - أناقة عصرية" },
      { property: "og:description", content: "Hedma هدمة - متجر ملابس عصري بأحدث الموديلات في التل الكبير . تيشيرتات، بناطيل، كوتشيات، [...]" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Hedma | هدمة - أناقة عصرية" },
      { name: "twitter:description", content: "Hedma هدمة - متجر ملابس عصري بأحدث الموديلات في التل الكبير . تيشيرتات، بناطيل، كوتشيات، [...]" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@500;700&display=swap" },
    ],
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthCtx();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isAuthRoute = path === "/auth";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (path !== "/auth" && !path.startsWith("/admin") && !path.startsWith("/vendor") && !path.startsWith("/delivery")) {
      try { localStorage.setItem("hedma:last_route", path); } catch {}
    }
  }, [path]);

  const isPrivilegedRoute = path.startsWith("/admin") || path.startsWith("/vendor") || path.startsWith("/delivery");

  useEffect(() => {
    if (loading) return;
    if (!session && isPrivilegedRoute) {
      router.navigate({ to: "/auth", replace: true });
    }
  }, [session, loading, isPrivilegedRoute, router]);

  if (!session && isAuthRoute) {
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
      <AIShoppingAssistant />
      <SocialProofPopup />
      <NotificationPrompt />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="hedma-ui-theme">
        <AuthProvider>
          <StorefrontThemeProvider>
            <CartProvider>
              <BrandingMeta />
              <AuthGuard>
                <Outlet />
              </AuthGuard>
              <Toaster richColors position="top-center" />
            </CartProvider>
          </StorefrontThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
