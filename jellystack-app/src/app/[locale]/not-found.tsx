import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Home } from "lucide-react";

// Localized 404 — picked up when a page under /[locale]/* is not found.
export default async function NotFoundPage() {
  const t = await getTranslations("notFound");
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-6xl font-bold text-violet-400">404</p>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-neutral-400">{t("body")}</p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
      >
        <Home className="h-4 w-4" /> {t("cta")}
      </Link>
    </div>
  );
}
