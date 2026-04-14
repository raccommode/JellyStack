"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const changeLocale = (newLocale: Locale) => {
    // next-intl middleware handles locale-prefix rewriting.
    // We strip the current locale from the path and let the router re-add the new one.
    const segments = pathname.split("/").filter(Boolean);
    if (locales.includes(segments[0] as Locale)) segments.shift();
    const nextPath = `/${newLocale}/${segments.join("/")}`.replace(/\/+$/, "") || `/${newLocale}`;
    startTransition(() => router.replace(nextPath));
  };

  return (
    <div className="relative">
      <label
        htmlFor="language-select"
        className="sr-only"
      >
        {t("label")}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm">
        <Globe className="h-4 w-4 text-neutral-400" aria-hidden />
        <select
          id="language-select"
          value={currentLocale}
          onChange={(e) => changeLocale(e.target.value as Locale)}
          disabled={isPending}
          aria-label={t("label")}
          className={cn(
            "cursor-pointer appearance-none bg-transparent pr-1 outline-none",
            isPending && "opacity-50",
          )}
        >
          {locales.map((locale) => (
            <option key={locale} value={locale} className="bg-neutral-900">
              {localeNames[locale].flag} {localeNames[locale].native}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
