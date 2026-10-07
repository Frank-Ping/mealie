import { useMemo, useState } from "react";
import { Button, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useGlobalI18n } from "@/composables/use-global-i18n";

export default function BaseKeyValueEditor() {
  const i18n = useGlobalI18n();

  const props = defineProps<{
    modelValue?: Record<string, string> | null;
    keyLabel?: string;
    valueLabel?: string;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", value: Record<string, string>): void;
  }>();

  // icons imported directly (was $globals)

  const resolvedKeyLabel = useMemo(() => props.keyLabel ?? i18n.t("general.key"), []); // WF4-REVIEW: dependency array
  const resolvedValueLabel = useMemo(() => props.valueLabel ?? i18n.t("general.value"), []); // WF4-REVIEW: dependency array

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  function current(): Record<string, string> {
    return { ...(props.modelValue ?? {}) };
  }

  function addEntry() {
    const key = newKey?.trim();
    if (!key) return;
    const updated = current();
    updated[key] = newValue;
    emit("update:modelValue", updated);
    setNewKey("");
    setNewValue("");
  }

  function onNewEntryFocusOut(e: FocusEvent) {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      addEntry();
    }
  }

  function updateValue(key: string, value: string) {
    const updated = current();
    updated[key] = value;
    emit("update:modelValue", updated);
  }

  function removeEntry(key: string) {
    const updated = current();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updated[key];
    emit("update:modelValue", updated);
  }

  return (
    <>
  <div>
    {(modelValue ?? {}).map((value, key) => (
      <div key={key} className="d-flex align-center mb-2 gap-2">
        {/* WF4-REVIEW: rules/error-messages → error+helperText */}
        <TextField model-value={key} label={resolvedKeyLabel} density="compact" variant="outlined" hide-details readonly className="me-3 flex-grow-1" />
        {/* WF4-REVIEW: rules/error-messages → error+helperText */}
        <TextField model-value={value} label={resolvedValueLabel} density="compact" variant="outlined" hide-details className="ms-3 flex-grow-1" onUpdateModelValue={updateValue(key, $event)} />
        <Button icon variant="text" color="error" size="small" onClick={removeEntry(key)}>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={icons.delete} />
        </Button>
      </div>
    ))}
    <div className="d-flex align-center mt-2 gap-2" onFocusout={onNewEntryFocusOut}>
      {/* WF4-REVIEW: rules/error-messages → error+helperText */}
      <TextField value={newKey} onChange={setNewKey} label={resolvedKeyLabel} density="compact" variant="outlined" hide-details className="me-3 flex-grow-1" onKeyDown={(e) => { e.preventDefault(); addEntry; }} />
      {/* WF4-REVIEW: rules/error-messages → error+helperText */}
      <TextField value={newValue} onChange={setNewValue} label={resolvedValueLabel} density="compact" variant="outlined" hide-details className="ms-3 flex-grow-1" onKeyDown={(e) => { e.preventDefault(); addEntry; }} />
      <Button icon variant="text" color="primary" size="small" disabled={!newKey?.trim()} onClick={addEntry}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.createAlt} />
      </Button>
    </div>
  </div>
    </>
  );
}
