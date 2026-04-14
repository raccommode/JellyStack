import { getTranslations } from "next-intl/server";
import { discoverApps } from "@/lib/umbrel";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const common = await getTranslations("common");
  const apps = discoverApps();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-neutral-400">{t("subtitle")}</p>
        <p className="mt-1 text-sm text-neutral-500">{t("detected", { count: apps.length })}</p>
      </section>

      {apps.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-6 py-12 text-center">
          <h2 className="text-xl font-semibold">{t("empty.title")}</h2>
          <p className="mt-2 text-sm text-neutral-400">{t("empty.description")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <article
              key={app.id}
              className="group flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 transition hover:border-violet-500/50 hover:bg-neutral-900"
            >
              <div>
                <h3 className="text-lg font-semibold capitalize">{app.id}</h3>
                <p className="mt-1 font-mono text-xs text-neutral-500">
                  {app.host}:{app.port}
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                {common("online")}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
