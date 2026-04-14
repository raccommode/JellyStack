import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: true,
});

export const config = {
  // Match all pathnames except:
  //   - /api/*      (API routes, locale-agnostic)
  //   - /_next/*    (Next.js internals)
  //   - static assets (images, favicons, etc.)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
