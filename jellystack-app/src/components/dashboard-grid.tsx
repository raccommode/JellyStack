"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import type { ServiceDef } from "@/lib/services";
import { cn } from "@/lib/utils";

interface HealthReport {
  results: Array<{ id: string; online: boolean }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DashboardGrid({ services }: { services: readonly ServiceDef[] }) {
  const common = useTranslations("common");
  const locale = useLocale();

  const { data } = useSWR<HealthReport>("/api/health", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });
  const online = new Map(data?.results.map((r) => [r.id, r.online]));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((svc) => {
        const state = online.get(svc.id);
        const isOnline = state === true;
        const isOffline = state === false;
        const href = `/${locale}/apps/${svc.id}`;
        return (
          <Link
            key={svc.id}
            href={href}
            className="group flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 transition hover:border-violet-500/50 hover:bg-neutral-900"
          >
            <div>
              <h3 className="text-base font-semibold">{svc.label}</h3>
              <p className="mt-1 text-xs text-neutral-500">
                {svc.category} · :{svc.port}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                isOnline && "bg-emerald-500/10 text-emerald-400",
                isOffline && "bg-rose-500/10 text-rose-400",
                state === undefined && "bg-neutral-500/10 text-neutral-400",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isOnline && "bg-emerald-400",
                  isOffline && "bg-rose-400",
                  state === undefined && "bg-neutral-400 animate-pulse",
                )}
              />
              {isOnline ? common("online") : isOffline ? common("offline") : common("loading")}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
