import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// D16: title-only replacement for useSeoMeta/useHead. Applies the app's
// "<title> · Mealie" pattern — verify against the Nuxt titleTemplate [S].
export function useDocumentTitle(title?: string | null) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = title ? `${title} · Mealie` : t("app.name", "Mealie");
  }, [title, t]);
}
