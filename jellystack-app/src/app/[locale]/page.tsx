import { getTranslations } from "next-intl/server";
import { SERVICES } from "@/lib/services";
import { DashboardGrid } from "@/components/dashboard-grid";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-neutral-400">{t("subtitle")}</p>
        <p className="mt-1 text-sm text-neutral-500">{t("detected", { count: SERVICES.length })}</p>
      </section>

      <DashboardGrid services={SERVICES} />
    </div>
  );
}
