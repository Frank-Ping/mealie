import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Autocomplete, CardContent, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
import { useLocales } from "@/composables/use-locales";
import { normalizeFilter } from "@/composables/use-utils";

export default function LanguageDialog() {
  const { t } = useTranslation();

  const modelValue = defineModel<boolean>({ default: () => false });

  const { locales: LOCALES, locale, i18n } = useLocales();

  const [selectedLocale, setSelectedLocale] = useState(locale);
  const onLocaleSelect = (value: string) => {
    if (value && locales.some(l => l === value)) {
      locale = value as any;
    }
  };

  /* WF4-REVIEW [J] */ watch(locale, () => {
    modelValue = false; // Close dialog when locale changes
  });

  const locales = LOCALES.filter(lc =>
    i18n.locales.map(i18nLocale => i18nLocale.code).includes(lc as any),
  );

  return (
    <>
  <BaseDialog value={modelValue} onChange={/* WF4-REVIEW: setter */ setModelValue} bottom-sheet icon={icons.translate} title={t('language-dialog.choose-language')}>
    <CardContent>
      {t("language-dialog.select-description")}
      {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
      <Autocomplete value={selectedLocale} onChange={setSelectedLocale} items={locales} custom-filter={normalizeFilter} item-title="name" item-value="value" className="my-3" hide-details variant="outlined" onUpdateModelValue={onLocaleSelect}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <div {...(props)} className="px-2 py-2">
            {/* WF4-REVIEW: content → primary prop */}
            <ListItemText>
              {item.name}
            </ListItemText>
            {/* WF4-REVIEW: content → secondary prop */}
            <ListItemText>
              {item.progress}
              %
              {t("language-dialog.translated")}
            </ListItemText>
          </div>
        </>
      </Autocomplete>
      <i18n-t keypath="language-dialog.how-to-contribute-description">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <a href="https://docs.mealie.io/contributors/translating/" target="_blank" className="text-primary">
            {t("language-dialog.read-the-docs")}
          </a>
        </>
      </i18n-t>
    </CardContent>
  </BaseDialog>
    </>
  );
}
