import { useTranslation } from "react-i18next";

// Rules §4 [S]: replaces vue-i18n's $d/$n. Styles approximate the app's
// dateTimeFormats tables (frontend/app/lang/dateTimeFormats) — verify per
// locale before calling this equivalent (marker left at call sites).
export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const d = (value: Date | number | string, style: "short" | "medium" | "long" = "medium") =>
    new Intl.DateTimeFormat(locale, { dateStyle: style }).format(new Date(value));

  const n = (value: number, style: "decimal" | "currency" | "percent" = "decimal", currency = "USD") =>
    new Intl.NumberFormat(locale, { style, currency }).format(value);

  return { d, n };
}
