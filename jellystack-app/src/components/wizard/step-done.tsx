"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";

export function StepDone() {
  const t = useTranslations("wizard.done");

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{t("heading")}</h2>
        <p className="mt-2 text-sm text-neutral-400">{t("body")}</p>
      </div>
      <div className="flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
        >
          <Home className="h-4 w-4" /> {t("cta")}
        </Link>
      </div>
    </div>
  );
}
