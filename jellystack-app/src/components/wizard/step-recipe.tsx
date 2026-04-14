"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Play, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepResult {
  step: string;
  ok: boolean;
  message?: string;
}

export function StepRecipe({
  recipeKey,
  recipeLabel,
  onNext,
  onBack,
}: {
  recipeKey: "prowlarr-to-arr" | "qbit-to-arr" | "paths";
  recipeLabel: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations(`wizard.recipes.${recipeLabel}`);
  const common = useTranslations("common");
  const wizardCommon = useTranslations("wizard.recipeCommon");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StepResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/integrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: recipeKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
      } else {
        setResults(data.results as StepResult[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  const anyFailed = results?.some((r) => !r.ok) ?? false;
  const allOk = (results?.length ?? 0) > 0 && !anyFailed;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-neutral-400">{t("body")}</p>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
        {results === null && !error && (
          <p className="text-sm text-neutral-500">
            {running ? wizardCommon("running") : wizardCommon("readyToRun")}
          </p>
        )}

        {error && (
          <p className="text-sm text-rose-400">
            {wizardCommon("error")}: {error}
          </p>
        )}

        {results && (
          <ul className="space-y-1.5 text-sm">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-2 font-mono text-xs">
                {r.ok ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                )}
                <div>
                  <div className={cn(r.ok ? "text-neutral-300" : "text-rose-300")}>{r.step}</div>
                  {r.message && <div className="text-neutral-500">{r.message}</div>}
                </div>
              </li>
            ))}
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
        <div className="flex items-center gap-2">
          {!allOk && (
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {results ? wizardCommon("runAgain") : wizardCommon("run")}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-50"
          >
            {allOk ? common("next") : wizardCommon("skip")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
