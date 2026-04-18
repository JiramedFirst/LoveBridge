import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  // All routes except API, _next, static files
  matcher: ["/((?!api|_next|_vercel|favicon\\.ico|icons|manifest\\.webmanifest|sw\\.js|workbox-.*).*)"],
};
