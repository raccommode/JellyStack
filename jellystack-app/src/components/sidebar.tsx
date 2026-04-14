"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Settings,
  Film,
  Tv,
  Music,
  Download,
  Activity,
  Bot,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { SERVICES, type ServiceCategory, type ServiceDef } from "@/lib/services";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<ServiceCategory, typeof Film> = {
  media: Film,
  requests: Tv,
  download: Download,
  monitoring: Activity,
  automation: Bot,
  transcoding: Sparkles,
  extras: Music,
};

const CATEGORY_ORDER: ServiceCategory[] = [
  "media",
  "requests",
  "download",
  "monitoring",
  "automation",
  "transcoding",
  "extras",
];

export function Sidebar() {
  const t = useTranslations("nav");
  const tcat = useTranslations("categories");
  const locale = useLocale();
  const pathname = usePathname();

  const byCategory = new Map<ServiceCategory, ServiceDef[]>();
  for (const svc of SERVICES) {
    const bucket = byCategory.get(svc.category) ?? [];
    bucket.push(svc);
    byCategory.set(svc.category, bucket);
  }

  const base = `/${locale}`;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="flex items-center gap-3 border-b border-neutral-800 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold">
          J
        </div>
        <span className="text-base font-semibold tracking-tight">JellyStack</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3 text-sm">
          <NavLink href={base} icon={LayoutDashboard} active={pathname === base}>
            {t("dashboard")}
          </NavLink>
          <NavLink href={`${base}/wizard`} icon={Wand2} active={isActive(`${base}/wizard`)}>
            {t("wizard")}
          </NavLink>
          <NavLink href={`${base}/settings`} icon={Settings} active={isActive(`${base}/settings`)}>
            {t("settings")}
          </NavLink>
        </ul>

        <div className="mt-6 px-3">
          <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {t("apps")}
          </h3>
          <ul className="mt-2 space-y-4">
            {CATEGORY_ORDER.map((category) => {
              const services = byCategory.get(category);
              if (!services || services.length === 0) return null;
              const Icon = CATEGORY_ICONS[category];
              return (
                <li key={category}>
                  <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    <span>{tcat(category)}</span>
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {services.map((svc) => {
                      const href = `${base}/apps/${svc.id}`;
                      return (
                        <li key={svc.id}>
                          <Link
                            href={href}
                            className={cn(
                              "flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-100",
                              isActive(href) && "bg-violet-500/10 text-violet-300",
                            )}
                          >
                            <span>{svc.label}</span>
                            {isActive(href) && <ChevronRight className="h-3 w-3" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  icon: Icon,
  active,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 transition",
          active
            ? "bg-violet-500/10 text-violet-300"
            : "text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {children}
      </Link>
    </li>
  );
}
