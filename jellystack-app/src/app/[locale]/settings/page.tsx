import { getTranslations } from "next-intl/server";
import { Shield, FolderTree, Users, Globe2, Clock } from "lucide-react";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  const sections: Array<{
    id: string;
    icon: typeof Shield;
    href: string;
  }> = [
    { id: "vpn",      icon: Shield,    href: "#vpn" },
    { id: "paths",    icon: FolderTree, href: "#paths" },
    { id: "users",    icon: Users,     href: "#users" },
    { id: "language", icon: Globe2,    href: "#language" },
    { id: "schedule", icon: Clock,     href: "#schedule" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-neutral-400">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map(({ id, icon: Icon, href }) => (
          <a
            key={id}
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 transition hover:border-violet-500/50 hover:bg-neutral-900"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold">{t(`${id}.label`)}</h3>
              <p className="mt-1 text-sm text-neutral-400">{t(`${id}.hint`)}</p>
            </div>
          </a>
        ))}
      </div>

      <section className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/50 p-6 text-center">
        <p className="text-sm text-neutral-500">{t("placeholder")}</p>
      </section>
    </div>
  );
}
