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

/* Silent error component — never blocks the user and NEVER auto-invalidates
   (auto-invalidate caused infinite re-load loops that reset cart/session state). */
function ErrorComponent({ error }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[Hedma] Error caught (silent):", error);
  }, [error]);

  return <div className="min-h-[40vh]" aria-hidden />;
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
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0cb31ece-aea9-43bb-be67-f370c46c6b65/id-preview-3daf2b8f--8c743c40-e4cc-4796-8885-804baf17e779.lovable.[...]" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0cb31ece-aea9-43bb-be67-f370c46c6b65/id-preview-3daf2b8f--8c743c40-e4cc-4796-8885-804baf17e779.lovable[...]" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@500;7[...]" },
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

/* [1] Fixed AuthGuard — no longer forces redirect for public pages; 
   the auth route renders without chrome. All other pages get full layout. */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthCtx();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isAuthRoute = path === "/auth";

  // Save last visited route so user can resume after login
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (path !== "/auth" && !path.startsWith("/admin") && !path.startsWith("/vendor") && !path.startsWith("/delivery")) {
      try { localStorage.setItem("hedma:last_route", path); } catch {}
    }
  }, [path]);

  // Only gate privileged dashboards. All other pages render immediately —
  // no loading screen, no forced redirect on refresh. Cached session restores in background.
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
