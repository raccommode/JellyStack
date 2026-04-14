"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

interface SecretsReport {
  sonarr: { found: boolean };
  radarr: { found: boolean };
  lidarr: { found: boolean };
  readarr: { found: boolean };
  prowlarr: { found: boolean };
  sabnzbd: { found: boolean };
  jellyfin: { found: boolean };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const APPS: Array<keyof SecretsReport> = [
  "prowlarr",
  "sonarr",
  "radarr",
  "lidarr",
  "readarr",
  "sabnzbd",
  "jellyfin",
];

export function StepSecrets({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const t = useTranslations("wizard.secrets");
  const common = useTranslations("common");
  const { data, isLoading } = useSWR<SecretsReport>("/api/secrets", fetcher);

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
          <ul className="divide-y divide-neutral-800">
            {APPS.map((app) => {
              const found = data?.[app]?.found;
              return (
                <li key={app} className="flex items-center justify-between py-2 text-sm">
                  <span className="capitalize font-medium">{app}</span>
                  {found ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> {t("autoDetected")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-500">
                      <AlertCircle className="h-4 w-4" /> {t("notFound")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" /> {common("back")}
        </button>
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
