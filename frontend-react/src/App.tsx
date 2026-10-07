import { useTranslation } from "react-i18next";

// WF4 Phase C scaffold. The route table that consumes the converted pages'
// `export const handle` (was definePageMeta) and the layouts/middleware guards
// is assembled in Phase D/E (judgement, rules §3). Until then this shell only
// proves the providers (theme + i18n) are wired.
export default function App() {
  const { t } = useTranslation();
  return (
    <div data-wf4="scaffold">
      {t("app.name", "Mealie")} — frontend-react scaffold (route table pending, Phase D)
    </div>
  );
}
