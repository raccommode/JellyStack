import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: t("appName"),
    description: t("tagline"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="h-screen overflow-hidden bg-neutral-950 text-neutral-100 antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex items-center justify-end border-b border-neutral-800 bg-neutral-900/50 px-6 py-3 backdrop-blur">
                <LanguageSwitcher />
              </header>
              <main className="min-h-0 flex-1 overflow-auto">{children}</main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
