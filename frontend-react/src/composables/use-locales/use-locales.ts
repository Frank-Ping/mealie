import type { LocaleObject } from "@nuxtjs/i18n";
import { LOCALES } from "./available-locales";
import { useGlobalI18n } from "../use-global-i18n";

export const useLocales = () => {
  const i18n = useGlobalI18n();
  const { current: vuetifyLocale } = useLocale();

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const locale = computed<LocaleObject["code"]>({
    get: () => i18n.locale,
    set(value) {
      i18n.setLocale(value);
    },
  });

  function updateLocale(lc: LocaleObject["code"]) {
    vuetifyLocale = lc;
  }

  // auto update vuetify locale
  /* WF4-REVIEW [J] */ watch(locale, (lc) => {
    updateLocale(lc);
  });

  // set initial locale
  if (i18n.locale) {
    updateLocale(i18n.locale);
  };

  return {
    locale,
    locales: LOCALES,
    i18n,
  };
};
