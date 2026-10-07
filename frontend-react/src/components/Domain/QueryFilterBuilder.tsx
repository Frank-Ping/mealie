import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Card, CardActions, CardContent, FormControlLabel, Grid, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import MdiIcon from "@/components/MdiIcon";
import { VueDraggable } from "vue-draggable-plus";
import { useDebounceFn } from "@vueuse/core";
import { useHouseholdSelf } from "@/composables/use-households";
import RecipeOrganizerSelector from "@/components/Domain/Recipe/RecipeOrganizerSelector";
import RecipeTimeInput from "@/components/Domain/Recipe/RecipeTimeInput";
import { Organizer } from "@/lib/api/types/non-generated";
import type {
  LogicalOperator,
  QueryFilterJSON,
  QueryFilterJSONPart,
  RelationalKeyword,
  RelationalOperator,
} from "@/lib/api/types/non-generated";
import { useCategoryStore, useFoodStore, useHouseholdStore, useLabelStore, useTagStore, useToolStore } from "@/composables/store";
import { useUserStore } from "@/composables/store/use-user-store";
import { type Field, type FieldDefinition, type FieldValue, type OrganizerBase, useQueryFilterBuilder } from "@/composables/use-query-filter-builder";

interface Props {
  fieldDefs: unknown[];
  initialQueryFilter?: Record<string, unknown>;
}

type FieldWithId = Field & { id: number };

export default function QueryFilterBuilder({ fieldDefs, initialQueryFilter = null }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */

  const emit = defineEmits<{
    (event: "input", value: string | undefined): void;
    (event: "inputJSON", value: QueryFilterJSON | undefined): void;
  }>();

  const { household } = useHouseholdSelf();
  const {
    logOps,
    placeholderKeywords,
    getRelOps,
    buildQueryFilterString,
    getFieldFromFieldDef,
    isOrganizerType,
  } = useQueryFilterBuilder();

  const firstDayOfWeek = computed(() => {
    return household?.preferences?.firstDayOfWeek || 0;
  });

  const state = /* WF4-REVIEW [J] */ reactive({
    showAdvanced: false,
    qfValid: false,
    datePickers: [] as boolean[],
    drag: false,
  });
  const { showAdvanced, datePickers, drag } = toRefs(state);

  const storeMap = {
    [Organizer.Category]: useCategoryStore(),
    [Organizer.Tag]: useTagStore(),
    [Organizer.Tool]: useToolStore(),
    [Organizer.Food]: useFoodStore(),
    [Organizer.Label]: useLabelStore(),
    [Organizer.Household]: useHouseholdStore(),
    [Organizer.User]: useUserStore(),
  };

  function onDragEnd(event: any) {
    state.drag = false;

    const oldIndex: number = event.oldIndex;
    const newIndex: number = event.newIndex;
    state.datePickers[oldIndex] = false;
    state.datePickers[newIndex] = false;
  }

  // add id to fields to prevent reactivity issues

  const [fields, setFields] = useState([]);

  const [uid, setUid] = useState(1); // init uid to pass to fields
  function useUid() {
    return uid++;
  }
  function addField(field: FieldDefinition) {
    fields.push({
      ...getFieldFromFieldDef(field),
      id: useUid(),
    });
    state.datePickers.push(false);
  }

  function setField(index: number, fieldLabel: string) {
    state.datePickers[index] = false;
    const fieldDef = fieldDefs.find(fieldDef => fieldDef.label === fieldLabel);
    if (!fieldDef) {
      return;
    }

    const resetValue = (fieldDef.type !== fields[index]!.type) || (fieldDef.fieldChoices !== fields[index]!.fieldChoices);
    const updatedField = { ...fields[index], ...fieldDef };

    // we have to set this explicitly since it might be undefined
    updatedField.fieldChoices = fieldDef.fieldChoices;

    fields[index] = {
      ...getFieldFromFieldDef(updatedField, resetValue),
      id: fields[index]!.id, // keep the id
    };

    // Defaults
    switch (fields[index].type) {
      case "date":
        fields[index] = safeNewDate("");
        break;
      case "relativeDate":
        fields[index] = "$NOW-30d";
        break;
      case "duration":
        fields[index] = 30 * 60;
        break;

      default:
        break;
    }
  }

  function setLeftParenthesisValue(field: FieldWithId, index: number, value: string) {
    fields[index]!.leftParenthesis = value;
  }

  function setRightParenthesisValue(field: FieldWithId, index: number, value: string) {
    fields[index]!.rightParenthesis = value;
  }

  function setLogicalOperatorValue(field: FieldWithId, index: number, value: LogicalOperator | undefined) {
    if (!value) {
      value = logOps.AND;
    }

    fields[index]!.logicalOperator = value ? logOps.value[value] : undefined;
  }

  function setRelationalOperatorValue(field: FieldWithId, index: number, value: RelationalKeyword | RelationalOperator) {
    const relOps = getRelOps(field.type);
    fields[index]!.relationalOperatorValue = relOps.value[value];
  }

  function setFieldValue(field: FieldWithId, index: number, value: FieldValue) {
    state.datePickers[index] = false;

    if (field.type === "relativeDate") {
      // Value is set to an int representing the offset from $NOW
      // Values are assumed to be negative offsets ('-') with a unit of days ('d')
      fields[index]! = `$NOW-${Math.abs(value)}d`;
    }
    else {
      fields[index]! = value;
    }
  }

  function setFieldValues(field: FieldWithId, index: number, values: FieldValue[]) {
    fields[index]!.values = values;
  }

  function setFieldOrganizers(field: FieldWithId, index: number, organizers: OrganizerBase[]) {
    fields[index]!.organizers = organizers;
    // Sync the values array with the organizers array
    fields[index]!.values = organizers.map(org => org.id?.toString() || "").filter(id => id);
  }

  function removeField(index: number) {
    fields.splice(index, 1);
    state.datePickers.splice(index, 1);
  }

  const fieldsUpdater = useDebounceFn(() => {
    const qf = buildQueryFilterString(fields, state.showAdvanced);
    if (qf) {
      console.debug(`Set query filter: ${qf}`);
    }
    state.qfValid = !!qf;

    emit("input", qf || undefined);
    emit("inputJSON", qf ? buildQueryFilterJSON() : undefined);
  }, 500);

  /* WF4-REVIEW [J] */ watch(fields, fieldsUpdater, { deep: true });

  async function hydrateOrganizers(field: FieldWithId, _index: number) {
    if (!field.values?.length || !isOrganizerType(field.type)) {
      return;
    }

    const { store, actions } = storeMap[field.type];
    if (!store.length) {
      await actions.refresh();
    }

    const organizers = field.values.map((value) => {
      const organizer = store.find(item => item?.id?.toString() === value);
      if (!organizer) {
        console.error(`Could not find organizer with id ${value}`);
        return undefined;
      }
      return organizer;
    });

    field.organizers = organizers.filter(organizer => organizer !== undefined) as OrganizerBase[];
    return field;
  }

  function initFieldsError(error = "") {
    if (error) {
      console.error(error);
    }

    setFields([]);
    if (fieldDefs.length) {
      addField(fieldDefs[0]!);
    }
  }

  async function initializeFields() {
    if (!initialQueryFilter?.parts?.length) {
      return initFieldsError();
    }

    const initFields: FieldWithId[] = [];
    let error = false;

    for (const [index, part] of initialQueryFilter.parts.entries()) {
      const fieldDef = fieldDefs.find(fieldDef => fieldDef.name === part.attributeName);
      if (!fieldDef) {
        error = true;
        return initFieldsError(`Invalid query filter; unknown attribute name "${part.attributeName || ""}"`);
      }

      const field: FieldWithId = {
        ...getFieldFromFieldDef(fieldDef),
        id: useUid(),
      };

      const relOps = getRelOps(field.type);

      field.leftParenthesis = part.leftParenthesis || field.leftParenthesis;
      field.rightParenthesis = part.rightParenthesis || field.rightParenthesis;
      field.logicalOperator = part.logicalOperator
        ? logOps.value[part.logicalOperator]
        : field.logicalOperator;
      field.relationalOperatorValue = part.relationalOperator
        ? relOps.value[part.relationalOperator]
        : field.relationalOperatorValue;
      field.relationalOperatorValue = part.relationalOperator
        ? relOps.value[part.relationalOperator]
        : field.relationalOperatorValue;

      if (field.leftParenthesis || field.rightParenthesis) {
        state.showAdvanced = true;
      }

      if (field.fieldChoices?.length || isOrganizerType(field.type)) {
        if (typeof part === "string") {
          field.values = part ? [part] : [];
        }
        else {
          field.values = part || [];
        }

        if (isOrganizerType(field.type)) {
          await hydrateOrganizers(field, index);
        }
      }
      else if (field.type === "boolean") {
        const boolString = part || "false";
        field = (
          boolString[0].toLowerCase() === "t"
          || boolString[0].toLowerCase() === "y"
          || boolString[0] === "1"
        );
      }
      else if (field.type === "number" || field.type === "duration") {
        field = Number(part as string || "0");
        if (isNaN(field)) {
          error = true;
          return initFieldsError(`Invalid query filter; invalid number value "${(part || "").toString()}"`);
        }
      }
      else if (field.type === "date") {
        field = part as string || "";
        const date = new Date(field);
        if (isNaN(date.getTime())) {
          error = true;
          return initFieldsError(`Invalid query filter; invalid date value "${(part || "").toString()}"`);
        }
      }
      else {
        field = part as string || "";
      }

      initFields.push(field);
    }

    if (initFields.length && !error) {
      setFields(initFields);
    }
    else {
      initFieldsError();
    }
  }

  /* WF4-REVIEW [J] */ onMounted(async () => {
    try {
      await initializeFields();
    }
    catch (error) {
      initFieldsError(`Error initializing fields: ${(error || "").toString()}`);
    }
  });

  function buildQueryFilterJSON(): QueryFilterJSON {
    const parts = fields.map((field) => {
      const part: QueryFilterJSONPart = {
        attributeName: field.name,
        leftParenthesis: field.leftParenthesis,
        rightParenthesis: field.rightParenthesis,
        logicalOperator: field.logicalOperator?,
        relationalOperator: field.relationalOperatorValue?,
      };

      if (field.fieldChoices?.length || isOrganizerType(field.type)) {
        part = field.values.map(value => value.toString());
      }
      else if (field.type === "boolean") {
        part = field ? "true" : "false";
      }
      else {
        part = (field || "").toString();
      }

      return part;
    });

    const qfJSON = { parts } as QueryFilterJSON;
    console.debug(`Built query filter JSON: ${JSON.stringify(qfJSON)}`);
    return qfJSON;
  }

  function safeNewDate(input: string): Date {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
    return date;
  }

  /**
   * Parse a relative date string offset (e.g. $NOW-30d --> 30)
   *
   * Currently only values with a negative offset ('-') and a unit of days ('d') are supported
   */
  function parseRelativeDateOffset(value: string): number {
    const defaultVal = 30;
    if (!value) {
      return defaultVal;
    }

    try {
      if (!value.startsWith(placeholderKeywords.value["$NOW"])) {
        return defaultVal;
      }

      const remainder = value.slice(placeholderKeywords.value["$NOW"].length);
      if (!remainder.startsWith("-")) {
        throw new Error("Invalid operator (not '-')");
      }

      if (remainder.slice(-1) !== "d") {
        throw new Error("Invalid unit (not 'd')");
      }

      // Slice off sign and unit
      return parseInt(remainder.slice(1, -1));
    }
    catch (error) {
      console.warn(`Unable to parse relative date offset from '${value}': ${error}`);
      return defaultVal;
    }
  }

  const config = computed(() => {
    const adv = state.showAdvanced;

    return {
      col: {
        class: "d-flex justify-center align-end py-0",
      },
      items: {
        icon: {
          cols: (_index: number) => 2,
          sm: (_index: number) => "auto",
          style: "width: fit-content;",
        },
        leftParens: {
          cols: (index: number) => (adv ? (index === 0 ? 2 : 0) : 0),
          sm: (_index: number) => (adv ? 1 : 0),
        },
        logicalOperator: {
          cols: (_index: number) => 0,
          // Fills the space left by the auto-width icon column
          sm: (_index: number) => true,
        },
        fieldName: {
          cols: (index: number) => {
            if (adv) return index === 0 ? 8 : 12;
            return index === 0 ? 10 : 12;
          },
          sm: (_index: number) => (adv ? 2 : 3),
        },
        relationalOperator: {
          cols: (_index: number) => 12,
          sm: (_index: number) => 2,
        },
        fieldValue: {
          cols: (index: number) => {
            const last = index === fields.length - 1;
            if (adv) return last ? 8 : 10;
            return last ? 10 : 12;
          },
          sm: (_index: number) => (adv ? 3 : 4),
        },
        rightParens: {
          cols: (index: number) => (adv ? (index === fields.length - 1 ? 2 : 0) : 0),
          sm: (_index: number) => (adv ? 1 : 0),
        },
        fieldActions: {
          cols: (index: number) => (index === fields.length - 1 ? 2 : 0),
          sm: (_index: number) => 1,
        },
      },
    };
  });

  return (
    <>
  <Card className="ma-0" flat fluid>
    <CardContent className="ma-0 pa-0">
      <VueDraggable value={fields} onChange={setFields} handle=".handle" delay={250} delay-on-touch-only={true} {...({
          animation: 200,
          group: 'recipe-instructions',
          ghostClass: 'ghost',
        })} onStart={drag = true} onEnd={onDragEnd}>
        {fields.map((field, index) => (
          <Grid container key={field.id} className="d-flex flex-row flex-wrap mx-auto pb-2" className={$vuetify.display.xs ? (Math.floor(index / 1) % 2 === 0 ? 'bg-dark' : 'bg-light') : ''} style="max-width: 100%;">
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols={config.items.icon.cols(index)} sm={config.items.icon.sm(index)} className={$vuetify.display.smAndDown ? 'd-flex pa-0' : 'd-flex'}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={$globals.icons.arrowUpDown} className="handle my-auto" size={28} style="cursor: move;" />
            </Grid>
            {(index != 0 || $vuetify.display.smAndUp) ? (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid cols={config.items.logicalOperator.cols(index)} sm={config.items.logicalOperator.sm(index)} className={config.col.class}>
                {(index) ? (
                  /* WF4-REVIEW: items/item-title/item-value → MenuItem children */
                  <TextField select model-value={field.logicalOperator?} items={[logOps.AND, logOps.OR]} item-title="label" item-value="value" variant="underlined" className="text-center" onUpdateModelValue={setLogicalOperatorValue(field, index, $event as unknown as LogicalOperator)} />
                ) : null}
              </Grid>
            ) : null}
            {(showAdvanced) ? (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid cols={config.items.leftParens.cols(index)} sm={config.items.leftParens.sm(index)} className={config.col.class}>
                {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
                <TextField select model-value={field.leftParenthesis} items={['', '(', '((', '(((']} variant="underlined" className="text-center" onUpdateModelValue={setLeftParenthesisValue(field, index, $event)} />
              </Grid>
            ) : null}
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols={config.items.fieldName.cols(index)} sm={config.items.fieldName.sm(index)} className={config.col.class}>
              {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
              <TextField select model-value={field.label} items={fieldDefs} variant="underlined" item-title="label" item-value="label" className="text-center" onUpdateModelValue={setField(index, $event)} />
            </Grid>
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols={config.items.relationalOperator.cols(index)} sm={config.items.relationalOperator.sm(index)} className={config.col.class}>
              {(field.type !== 'boolean') ? (
                /* WF4-REVIEW: items/item-title/item-value → MenuItem children */
                <TextField select model-value={field.relationalOperatorValue?} items={field.relationalOperatorChoices} item-title="label" item-value="value" variant="underlined" className="text-center" onUpdateModelValue={setRelationalOperatorValue(field, index, $event as unknown as RelationalKeyword | RelationalOperator)} />
              ) : null}
            </Grid>
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols={config.items.fieldValue.cols(index)} sm={config.items.fieldValue.sm(index)} className={config.col.class}>
              {(field.fieldChoices) ? (
                /* WF4-REVIEW: items/item-title/item-value → MenuItem children */
                <TextField select model-value={field.values} items={field.fieldChoices} item-title="label" item-value="value" multiple variant="underlined" onUpdateModelValue={setFieldValues(field, index, $event)} />
              ) : (field.type === 'string') ? (
                /* WF4-REVIEW: rules/error-messages → error+helperText */
                <TextField model-value={field} variant="underlined" onUpdateModelValue={setFieldValue(field, index, $event)} />
              ) : (field.type === 'number') ? (
                /* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */
                <VNumberInput model-value={field as number || 0} variant="underlined" inset min={0} max={5} precision={null} onUpdateModelValue={setFieldValue(field, index, $event)} />
              ) : (field.type === 'boolean') ? (
                /* WF4-REVIEW: control={<Checkbox/>} + label prop */
                <FormControlLabel model-value={field} onUpdateModelValue={setFieldValue(field, index, $event!)} />
              ) : (field.type === 'date') ? (
                /* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J]; v-model on complex expression "datePickers[index]" [J] */
                <VMenu {/* WF4-REVIEW: v-model datePickers[index] */} close-on-content-click={false} transition="scale-transition" offset-y max-width="290px" min-width="auto">
                  <template>
                    {/* WF4-REVIEW: rules/error-messages → error+helperText */}
                    <TextField model-value={$d(safeNewDate(field + 'T00:00:00'))} variant="underlined" color="primary" className="date-input" {...(activatorProps)} readonly />
                  </template>
                  {/* WF4-REVIEW: value format + LocalizationProvider */}
                  <DatePicker model-value={safeNewDate(field + 'T00:00:00')} hide-header first-day-of-week={firstDayOfWeek} local={$i18n.locale} onUpdateModelValue={val => setFieldValue(field, index, val ? val.toISOString().slice(0, 10) : '')} />
                </VMenu>
              ) : null}
              {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
              <VNumberInput model-value={parseRelativeDateOffset(field)} suffix={t('query-filter.dates.days-ago', parseRelativeDateOffset(field))} variant="underlined" density="compact" inset min={0} precision={0} className="date-input" onUpdateModelValue={setFieldValue(field, index, $event)} />
              <RecipeTimeInput seconds={field as number || null} hide-text className="w-100" onUpdateSeconds={setFieldValue(field, index, $event ?? '')} />
              {/* WF4-REVIEW: v-model on complex expression "field.organizers" [J] */}
              <RecipeOrganizerSelector {/* WF4-REVIEW: v-model field.organizers */} selector-type={Organizer.Category} show-add={false} show-label={false} show-icon={false} variant="underlined" onUpdateModelValue={val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])} />
              {/* WF4-REVIEW: v-model on complex expression "field.organizers" [J] */}
              <RecipeOrganizerSelector {/* WF4-REVIEW: v-model field.organizers */} selector-type={Organizer.Tag} show-add={false} show-label={false} show-icon={false} variant="underlined" onUpdateModelValue={val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])} />
              {/* WF4-REVIEW: v-model on complex expression "field.organizers" [J] */}
              <RecipeOrganizerSelector {/* WF4-REVIEW: v-model field.organizers */} selector-type={Organizer.Tool} show-add={false} show-label={false} show-icon={false} variant="underlined" onUpdateModelValue={val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])} />
              {/* WF4-REVIEW: v-model on complex expression "field.organizers" [J] */}
              <RecipeOrganizerSelector {/* WF4-REVIEW: v-model field.organizers */} selector-type={Organizer.Food} show-add={false} show-label={false} show-icon={false} variant="underlined" onUpdateModelValue={val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])} />
              {/* WF4-REVIEW: v-model on complex expression "field.organizers" [J] */}
              <RecipeOrganizerSelector {/* WF4-REVIEW: v-model field.organizers */} selector-type={Organizer.Household} show-add={false} show-label={false} show-icon={false} variant="underlined" onUpdateModelValue={val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])} />
              {/* WF4-REVIEW: v-model on complex expression "field.organizers" [J] */}
              <RecipeOrganizerSelector {/* WF4-REVIEW: v-model field.organizers */} selector-type={Organizer.User} show-add={false} show-label={false} show-icon={false} variant="underlined" onUpdateModelValue={val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])} />
              {/* WF4-REVIEW: v-model on complex expression "field.organizers" [J] */}
              <RecipeOrganizerSelector {/* WF4-REVIEW: v-model field.organizers */} selector-type={Organizer.Label} show-add={false} show-label={false} show-icon={false} variant="underlined" onUpdateModelValue={val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])} />
            </Grid>
            {(showAdvanced) ? (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid cols={config.items.rightParens.cols(index)} sm={config.items.rightParens.sm(index)} className={config.col.class}>
                {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
                <TextField select model-value={field.rightParenthesis} items={['', ')', '))', ')))']} variant="underlined" className="text-center" onUpdateModelValue={setRightParenthesisValue(field, index, $event)} />
              </Grid>
            ) : null}
            {(!$vuetify.display.xs || index === fields.length - 1) ? (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid cols={config.items.fieldActions.cols(index)} sm={config.items.fieldActions.sm(index)} className={config.col.class}>
                {(!$vuetify.display.smAndDown || index === fields.length - 1) ? (
                  <BaseButtonGroup buttons={[
                {
                  icon: $globals.icons.delete,
                  text: t('general.delete'),
                  event: 'delete',
                  disabled: fields.length === 1,
                },
              ]} className="my-auto" onDelete={removeField(index)} />
                ) : null}
              </Grid>
            ) : null}
          </Grid>
        ))}
      </VueDraggable>
    </CardContent>
    <CardActions>
      <Grid container fluid className="d-flex justify-end ma-2">
        <Box sx={ flexGrow: 1 } />
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={showAdvanced} onChange={/* WF4-REVIEW: setter */ setShowAdvanced} hide-details label={t('general.show-advanced')} className="my-auto mr-4" color="primary" />
        <BaseButton create text={t('general.add-field')} className="my-auto" onClick={addField(fieldDefs[0]!)} />
      </Grid>
    </CardActions>
  </Card>
    </>
  );
}
