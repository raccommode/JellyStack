"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { ArrowRight } from "lucide-react";

interface Discovered {
  count: number;
  apps: Array<{ id: string; url: string }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function StepWelcome({ onNext }: { onNext: () => void }) {
  const t = useTranslations("wizard.welcome");
  const common = useTranslations("common");
  const { data, isLoading } = useSWR<Discovered>("/api/discover", fetcher);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-neutral-400">{t("body")}</p>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
        {isLoading ? (
          <p className="text-sm text-neutral-500">{common("loading")}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("detected", { count: data?.count ?? 0 })}
            </p>
            {data && data.apps.length > 0 && (
              <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-neutral-400 sm:grid-cols-3">
                {data.apps.map((a) => (
                  <li key={a.id} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="capitalize">{a.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
        >
          {common("next")} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
