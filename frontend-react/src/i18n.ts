import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "./lang/messages/en-US.json";

// D1: keep vue-i18n's single-brace {var} interpolation so all 126 locale files
// are reused unchanged. Pipe-plural strings (D2) are transformed by a separate
// script in Phase D; until then those specific keys render as-is.
void i18n.use(initReactI18next).init({
  resources: { "en-US": { translation: enUS } },
  lng: "en-US",
  fallbackLng: "en-US",
  interpolation: { prefix: "{", suffix: "}", escapeValue: false },
});

export default i18n;
