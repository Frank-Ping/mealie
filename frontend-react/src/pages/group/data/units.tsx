import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Autocomplete, CardContent, ListItem, ListItemText } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import type { LocaleObject } from "@nuxtjs/i18n";
import RecipeDataAliasManagerDialog from "@/components/Domain/Recipe/RecipeDataAliasManagerDialog";
import { validators } from "@/composables/use-validators";
import { useUserApi } from "@/composables/api";
import type { CreateIngredientUnit, IngredientUnit, IngredientUnitAlias } from "@/lib/api/types/recipe";
import type { StandardizedUnitType } from "@/lib/api/types/non-generated";
import { useLocales } from "@/composables/use-locales";
import { normalizeFilter } from "@/composables/use-utils";
import { useUnitStore } from "@/composables/store";
import type { AutoFormItems } from "@/types/auto-forms";
import type { TableHeaders, TableConfig } from "@/components/global/CrudTable";
import { fieldTypes } from "@/composables/forms";

type StandardizedUnitTypeOption = {
  text: string;

export default function Units() {
  const { t } = useTranslation();

  const userApi = useUserApi();
  const i18n = useI18n();

  const tableConfig: TableConfig = {
    hideColumns: true,
    canExport: true,
  };
  const tableHeaders: TableHeaders[] = [
    {
      text: i18n.t("general.id"),
      value: "id",
      show: false,
    },
    {
      text: i18n.t("general.name"),
      value: "name",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("general.plural-name"),
      value: "pluralName",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("data-pages.units.abbreviation"),
      value: "abbreviation",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("data-pages.units.plural-abbreviation"),
      value: "pluralAbbreviation",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("data-pages.units.use-abbv"),
      value: "useAbbreviation",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("data-pages.units.description"),
      value: "description",
      show: false,
    },
    {
      text: i18n.t("data-pages.units.fraction"),
      value: "fraction",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("data-pages.units.standard-quantity"),
      value: "standardQuantity",
      show: false,
    },
    {
      text: i18n.t("data-pages.units.standard-unit"),
      value: "standardUnit",
      show: false,
    },
    {
      text: i18n.t("general.date-added"),
      value: "createdAt",
      show: false,
      sortable: true,
    },
  ];

  const { store: unitStore, actions: unitActions } = useUnitStore();

  // ============================================================
  // Form items (shared)

    value: StandardizedUnitType;
  };

  const formItems = useMemo(() => [
    {
      cols: 8,
      label: i18n.t("general.name", []); // WF4-REVIEW: dependency array,
      varName: "name",
      type: fieldTypes.TEXT,
      rules: [validators.required],
    },
    {
      cols: 4,
      label: i18n.t("data-pages.units.abbreviation"),
      varName: "abbreviation",
      type: fieldTypes.TEXT,
    },
    {
      cols: 8,
      label: i18n.t("general.plural-name"),
      varName: "pluralName",
      type: fieldTypes.TEXT,
    },
    {
      cols: 4,
      label: i18n.t("data-pages.units.plural-abbreviation"),
      varName: "pluralAbbreviation",
      type: fieldTypes.TEXT,
    },
    {
      label: i18n.t("data-pages.units.description"),
      varName: "description",
      type: fieldTypes.TEXT,
    },
    {
      section: i18n.t("data-pages.units.standardization"),
      sectionDetails: i18n.t("data-pages.units.standardization-description"),
      cols: 2,
      varName: "standardQuantity",
      type: fieldTypes.NUMBER,
      numberInputConfig: {
        min: 0,
        max: undefined,
        precision: null,
        controlVariant: "hidden",
      },
    },
    {
      cols: 10,
      varName: "standardUnit",
      type: fieldTypes.SELECT,
      selectReturnValue: "value",
      options: [
        {
          text: i18n.t("data-pages.units.standard-unit-labels.fluid-ounce"),
          value: "fluid_ounce",
        },
        {
          text: i18n.t("data-pages.units.standard-unit-labels.cup"),
          value: "cup",
        },
        {
          text: i18n.t("data-pages.units.standard-unit-labels.ounce"),
          value: "ounce",
        },
        {
          text: i18n.t("data-pages.units.standard-unit-labels.pound"),
          value: "pound",
        },
        {
          text: i18n.t("data-pages.units.standard-unit-labels.milliliter"),
          value: "milliliter",
        },
        {
          text: i18n.t("data-pages.units.standard-unit-labels.liter"),
          value: "liter",
        },
        {
          text: i18n.t("data-pages.units.standard-unit-labels.gram"),
          value: "gram",
        },
        {
          text: i18n.t("data-pages.units.standard-unit-labels.kilogram"),
          value: "kilogram",
        },
      ] as StandardizedUnitTypeOption[],
    },
    {
      section: i18n.t("general.settings"),
      cols: 4,
      label: i18n.t("data-pages.units.use-abbv"),
      varName: "useAbbreviation",
      type: fieldTypes.BOOLEAN,
    },
    {
      cols: 4,
      label: i18n.t("data-pages.units.fraction"),
      varName: "fraction",
      type: fieldTypes.BOOLEAN,
    },
  ]);

  // ============================================================
  // Create
  const createForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: {
      name: "",
      fraction: false,
      useAbbreviation: false,
    } as CreateIngredientUnit,
  });

  async function handleCreate(createFormData: CreateIngredientUnit) {
    // @ts-expect-error createOne eroniusly expects id which is not preset at time of creation
    await unitActions.createOne(createFormData);
    createForm.data = {
      name: "",
      fraction: false,
      useAbbreviation: false,
    } as CreateIngredientUnit;
  }

  // ============================================================
  // Edit
  const editForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: {} as IngredientUnit,
  });

  async function handleEdit(editFormData: IngredientUnit) {
    await unitActions.updateOne(editFormData);
    editForm.data = {} as IngredientUnit;
  }

  // ============================================================
  // Bulk Actions
  async function handleBulkAction(event: string, items: IngredientUnit[]) {
    if (event === "delete-selected") {
      const ids = items.filter(item => item.id != null).map(item => item.id!);
      await unitActions.deleteMany(ids);
    }
  }

  // ============================================================
  // Alias Manager

  const [aliasManagerDialog, setAliasManagerDialog] = useState(false);
  function updateUnitAlias(newAliases: IngredientUnitAlias[]) {
    if (!editForm.data) {
      return;
    }
    editForm.data.aliases = newAliases;
    setAliasManagerDialog(false);
  }

  // ============================================================
  // Merge Units

  const [mergeDialog, setMergeDialog] = useState(false);
  const [fromUnit, setFromUnit] = useState(null);
  const [toUnit, setToUnit] = useState(null);

  const canMerge = computed(() => {
    return fromUnit && toUnit && fromUnit.id !== toUnit.id;
  });

  async function mergeUnits() {
    if (!canMerge || !fromUnit || !toUnit) {
      return;
    }

    const { data } = await userApi.units.merge(fromUnit.id, toUnit.id);

    if (data) {
      unitActions.refresh();
    }
  }

  // ============================================================
  // Seed

  const [seedDialog, setSeedDialog] = useState(false);
  const [locale, setLocale] = useState("");

  const { locales: LOCALES, locale: currentLocale } = useLocales();

  /* WF4-REVIEW [J] */ onMounted(() => {
    setLocale(currentLocale);
  });

  const locales = LOCALES.filter(locale =>
    (i18n.locales as LocaleObject[]).map(i18nLocale => i18nLocale.code).includes(locale as any),
  );

  async function seedDatabase() {
    const { data } = await userApi.seeders.units({ locale: locale });

    if (data) {
      unitActions.refresh();
    }
  }

  return (
    <>
  <div>
    <BaseDialog value={mergeDialog} onChange={setMergeDialog} bottom-sheet icon={$globals.icons.units} title={t('data-pages.units.combine-unit')} can-confirm onConfirm={mergeUnits}>
      <CardContent>
        <i18n-t keypath="data-pages.units.combine-unit-description">
          <template>
            <strong>
              {t('data-pages.recipes.source-unit-will-be-deleted')}
            </strong>
          </template>
        </i18n-t>
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={fromUnit} onChange={setFromUnit} return-object items={unitStore} custom-filter={normalizeFilter} item-title="name" label={t('data-pages.units.source-unit')} className="mt-2" />
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={toUnit} onChange={setToUnit} return-object items={unitStore} custom-filter={normalizeFilter} item-title="name" label={t('data-pages.units.target-unit')} />
        {(canMerge && fromUnit && toUnit) ? (
          <template>
            <div className="text-center">
              {t('data-pages.units.merging-unit-into-unit', [fromUnit.name, toUnit.name])}
            </div>
          </template>
        ) : null}
      </CardContent>
    </BaseDialog>
    {(editForm.data) ? (
      <RecipeDataAliasManagerDialog value={aliasManagerDialog} onChange={setAliasManagerDialog} data={editForm.data} can-submit onSubmit={updateUnitAlias} onCancel={aliasManagerDialog = false} />
    ) : null}
    <BaseDialog value={seedDialog} onChange={setSeedDialog} bottom-sheet icon={$globals.icons.foods} title={t('data-pages.seed-data')} can-confirm onConfirm={seedDatabase}>
      <CardContent>
        <div className="pb-2">
          {t("data-pages.units.seed-dialog-text")}
        </div>
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={locale} onChange={setLocale} items={locales} item-title="name" label={t('data-pages.select-language')} className="my-3" hide-details variant="outlined" offset>
          <template>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem {...(props)}>
              {/* WF4-REVIEW: content → secondary prop */}
              <ListItemText>
                {item.raw.progress}
                %
                {t("language-dialog.translated")}
              </ListItemText>
            </ListItem>
          </template>
        </Autocomplete>
        {(unitStore && unitStore.length > 0) ? (
          <Alert type="error" className="mb-0 text-body-2">
            {t("data-pages.foods.seed-dialog-warning")}
          </Alert>
        ) : null}
      </CardContent>
    </BaseDialog>
    <GroupDataPage icon={$globals.icons.units} title={t('general.units')} create-title={t('data-pages.units.create-unit')} edit-title={t('data-pages.units.edit-unit')} table-headers={tableHeaders} table-config={tableConfig} data={unitStore || []} bulk-actions={[{ icon: $globals.icons.delete, text: t('general.delete'), event: 'delete-selected' }]} create-form={createForm} edit-form={editForm} onCreateOne={handleCreate} onEditOne={handleEdit} onDeleteOne={unitActions.deleteOne} onBulkAction={handleBulkAction}>
      <template>
        <BaseButton icon={$globals.icons.externalLink} onClick={mergeDialog = true}>
          {t('data-pages.combine')}
        </BaseButton>
      </template>
      <template>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={item.useAbbreviation ? $globals.icons.check : $globals.icons.close} color={item.useAbbreviation ? 'success' : undefined} />
      </template>
      <template>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={item.fraction ? $globals.icons.check : $globals.icons.close} color={item.fraction ? 'success' : undefined} />
      </template>
      <template>
        {item.createdAt ? $d(new Date(item.createdAt)) : ''}
      </template>
      <template>
        <BaseButton icon={$globals.icons.database} onClick={seedDialog = true}>
          {t('data-pages.seed')}
        </BaseButton>
      </template>
      <template>
        <BaseButton icon={$globals.icons.tags} color="info" onClick={aliasManagerDialog = true}>
          {t('data-pages.manage-aliases')}
        </BaseButton>
      </template>
    </GroupDataPage>
  </div>
    </>
  );
}
