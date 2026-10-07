import { Card, CardContent, CardHeader, Divider, FormControlLabel, Grid, TextField, form } from "@mui/material";
import { fieldTypes } from "@/composables/forms";
import type { AutoFormItems } from "@/types/auto-forms";

interface Props {
  updateMode?: boolean;
  items?: unknown[];
  width?: unknown;
  color?: string;
  dark?: boolean;
  disabledFields?: unknown[];
  readonlyFields?: unknown[];
}

export default function AutoForm({ updateMode = false, items = null, width = "max", color = null, dark = false, disabledFields = null, readonlyFields = null }: Props) {
  // Use defineModel for v-model
  const model = defineModel<Record<string, any> | any[]>({
    type: [Object, Array],
    required: true,
  });
  const isValid = defineModel("isValid", { type: Boolean, default: false });

  const props = /* props via generated interface + destructured signature */

  // Combined state map for readonly and disabled fields
  const fieldState = computed<Record<string, { readonly: boolean; disabled: boolean }>>(() => {
    const map: Record<string, { readonly: boolean; disabled: boolean }> = {};
    (items || []).forEach((field: any) => {
      const base = (field.disableUpdate && updateMode) || (!updateMode && field.disableCreate);
      map[field.varName] = {
        readonly: base || !!readonlyFields?.includes(field.varName),
        disabled: base || !!disabledFields?.includes(field.varName),
      };
    });
    return map;
  });

  return (
    <>
  {/* WF4-REVIEW: validation semantics [J] */}
  <form value={isValid} onChange={/* WF4-REVIEW: setter */ setIsValid} validate-on="input">
    <Card color={color} dark={dark} flat width={width} className="my-2">
      <Grid container no-gutters>
        {items.map((inputField, index) => (
          <template key={index}>
            {(inputField.section) ? (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid cols={12} className="px-2">
                <Divider className="my-2" />
                {/* WF4-REVIEW: title text moves to the title prop */}
                <CardHeader className="pl-0">
                  {inputField.section}
                </CardHeader>
                {(inputField.sectionDetails) ? (
                  <CardContent className="pl-0 mt-0 pt-0">
                    {inputField.sectionDetails}
                  </CardContent>
                ) : null}
              </Grid>
            ) : null}
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols={inputField.cols || 12} className="px-2">
              {(inputField.type === fieldTypes.BOOLEAN) ? (
                /* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "model[inputField.varName]" [J] */
                <FormControlLabel {/* WF4-REVIEW: v-model model[inputField.varName] */} name={inputField.varName} readonly={fieldState[inputField.varName]?.readonly} disabled={fieldState[inputField.varName]?.disabled} hint={inputField.hint} hide-details={!inputField.hint} persistent-hint={!!inputField.hint} density="comfortable" validate-on="input">
                  <template>
                    <span className="ml-4">
                      {inputField.label}
                    </span>
                  </template>
                </FormControlLabel>
              ) : null}
              {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "model[inputField.varName]" [J] */}
              <TextField {/* WF4-REVIEW: v-model model[inputField.varName] */} readonly={fieldState[inputField.varName]?.readonly} disabled={fieldState[inputField.varName]?.disabled} type={inputField.type === fieldTypes.PASSWORD ? 'password' : 'text'} variant="solo-filled" flat density="comfortable" label={inputField.label} name={inputField.varName} hint={inputField.hint || ''} rules={!(inputField.disableUpdate && updateMode) ? inputField.rules || [] : []} validate-on="input" />
              {/* WF4-REVIEW: v-model on complex expression "model[inputField.varName]" [J] */}
              <TextField multiline {/* WF4-REVIEW: v-model model[inputField.varName] */} readonly={fieldState[inputField.varName]?.readonly} disabled={fieldState[inputField.varName]?.disabled} variant="solo-filled" flat rows="3" auto-grow density="comfortable" label={inputField.label} name={inputField.varName} hint={inputField.hint || ''} rules={!(inputField.disableUpdate && updateMode) ? inputField.rules || [] : []} validate-on="input" />
              {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J]; v-model on complex expression "model[inputField.varName]" [J] */}
              <VNumberInput {/* WF4-REVIEW: v-model model[inputField.varName] */} variant="underlined" control-variant={inputField.numberInputConfig?.controlVariant} density="comfortable" label={inputField.label} name={inputField.varName} min={inputField.numberInputConfig?.min} max={inputField.numberInputConfig?.max} precision={inputField.numberInputConfig?.precision} hint={inputField.hint} hide-details={!inputField.hint} persistent-hint={!!inputField.hint} rules={!(inputField.disableUpdate && updateMode) ? inputField.rules || [] : []} validate-on="input" />
              {/* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "model[inputField.varName]" [J] */}
              <TextField select {/* WF4-REVIEW: v-model model[inputField.varName] */} readonly={fieldState[inputField.varName]?.readonly} disabled={fieldState[inputField.varName]?.disabled} variant="solo-filled" flat label={inputField.label} name={inputField.varName} items={inputField.options} item-title="text" item-value={inputField.selectReturnValue || 'text'} return-object={false} hint={inputField.hint} density="comfortable" persistent-hint rules={!(inputField.disableUpdate && updateMode) ? inputField.rules || [] : []} validate-on="input" />
              <div className="d-flex" style="width: 100%">
                {/* WF4-REVIEW: v-model on complex expression "model[inputField.varName]" [J] */}
                <InputColor {/* WF4-REVIEW: v-model model[inputField.varName] */} />
              </div>
            </Grid>
          </template>
        ))}
      </Grid>
    </Card>
  </form>
    </>
  );
}
