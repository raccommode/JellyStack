import { cn } from "@/lib/utils";

export function WizardStepper({ current, total }: { current: number; total: number }) {
  const steps = Array.from({ length: total }, (_, i) => i);
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {steps.map((i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i < current && "bg-violet-500",
            i === current && "bg-violet-400",
            i > current && "bg-neutral-800",
          )}
        />
      ))}
    </div>
  );
}
