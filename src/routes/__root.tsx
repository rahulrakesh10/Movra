import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useMatchRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, type ComponentType } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Dumbbell, CalendarDays, UtensilsCrossed, TrendingUp, User } from "lucide-react";
import { useFitnessStore } from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
    ],
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { title: "Movra" },
      { name: "description", content: "Simple fitness & food tracker. One screen at a time." },
      { name: "theme-color", content: "#0a0a0a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Movra" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "Movra" },
      {
        property: "og:description",
        content: "Simple fitness & food tracker. One screen at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const themeScript = `(function(){try{var s=localStorage.getItem('fitness-tracker-storage');var t='system';if(s){var p=JSON.parse(s);t=(p&&p.state&&p.state.theme)||'system';}var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

type NavItemDef = { to: string; label: string; icon: ComponentType<{ className?: string }> };

function NavTab({ item }: { item: NavItemDef }) {
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({ to: item.to, fuzzy: item.to !== "/" });
  return (
    <Link to={item.to} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2">
      <div
        className={`flex items-center justify-center rounded-full px-3 py-1 transition-all duration-100 ${
          isActive ? "bg-primary/10" : ""
        }`}
      >
        <item.icon
          className={`h-5 w-5 transition-colors duration-100 ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </div>
      <span
        className={`text-[10px] font-semibold leading-none tracking-wide transition-colors duration-100 ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {item.label}
      </span>
    </Link>
  );
}

function BottomNav() {
  const navItems: NavItemDef[] = [
    { to: "/", label: "Today", icon: Dumbbell },
    { to: "/routine", label: "Routine", icon: CalendarDays },
    { to: "/food", label: "Food", icon: UtensilsCrossed },
    { to: "/progress", label: "Progress", icon: TrendingUp },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex w-full items-stretch px-1 py-1">
        {navItems.map((item) => (
          <NavTab key={item.to} item={item} />
        ))}
      </div>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const hydrated = useHydrated();
  const onboarded = useFitnessStore((s) => s.onboarded);
  const theme = useFitnessStore((s) => s.theme);
  const showNav = hydrated && onboarded;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const apply = () => {
      const prefersDark =
        typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const useDark = theme === "dark" || (theme === "system" && prefersDark);
      root.classList.toggle("dark", useDark);
    };
    apply();
    if (theme === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="mx-auto min-h-screen max-w-lg bg-background"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: showNav ? "calc(4.5rem + env(safe-area-inset-bottom))" : undefined,
        }}
      >
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </QueryClientProvider>
  );
}
