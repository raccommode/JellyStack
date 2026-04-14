"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { WizardStepper } from "@/components/wizard-stepper";
import { StepWelcome } from "@/components/wizard/step-welcome";
import { StepSecrets } from "@/components/wizard/step-secrets";
import { StepRecipe } from "@/components/wizard/step-recipe";
import { StepDone } from "@/components/wizard/step-done";

const STEPS = [
  "welcome",
  "secrets",
  "prowlarr-to-arr",
  "paths",
  "qbit-to-arr",
  "done",
] as const;

type StepId = (typeof STEPS)[number];

export default function WizardPage() {
  const t = useTranslations("wizard");
  const [current, setCurrent] = useState<StepId>("welcome");
  const index = STEPS.indexOf(current);
  const total = STEPS.length;

  const goNext = () => setCurrent(STEPS[Math.min(index + 1, total - 1)]);
  const goBack = () => setCurrent(STEPS[Math.max(index - 1, 0)]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-neutral-400">{t("subtitle")}</p>
        </div>
      </header>

      <WizardStepper current={index} total={total} />

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
        {current === "welcome" && <StepWelcome onNext={goNext} />}
        {current === "secrets" && <StepSecrets onNext={goNext} onBack={goBack} />}
        {current === "prowlarr-to-arr" && (
          <StepRecipe
            recipeKey="prowlarr-to-arr"
            recipeLabel="prowlarr"
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {current === "paths" && (
          <StepRecipe
            recipeKey="paths"
            recipeLabel="paths"
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {current === "qbit-to-arr" && (
          <StepRecipe
            recipeKey="qbit-to-arr"
            recipeLabel="qbit"
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {current === "done" && <StepDone />}
      </section>
    </div>
  );
}
