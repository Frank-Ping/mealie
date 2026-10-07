import { useState } from "react";
import { TextField } from "@mui/material";
import { useRecipeTime } from "@/composables/recipes";

export default function RecipeTimeInput() {
  defineProps<{ label?: string; hideText?: boolean }>();

  const { durationUnitLabel } = useRecipeTime();

  const seconds = defineModel<number | null | undefined>("seconds", { required: true });
  const text = defineModel<string | null | undefined>("text");

  /** Keeps hours, minutes, and any leftover seconds under the database's 2^31 - 1 limit */
  const MAX_HOURS = Math.floor((2 ** 31 - 1 - 3599) / 3600);

  const [hours, setHours] = useState(null);
  const [minutes, setMinutes] = useState(null);

  function toSeconds(): number | null {
    // Imported times can carry seconds the inputs don't show, which shouldn't be lost on edit
    const leftover = (seconds ?? 0) % 60;
    const total = (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + leftover;
    return total > 0 ? total : null;
  }

  /* WF4-REVIEW [J] */ watch(
    seconds,
    (value) => {
      // Only re-split outside changes, so typing "90" minutes isn't rewritten to 1 hour 30 mid-edit
      if ((value ?? null) === toSeconds()) {
        return;
      }
      setHours(value ? Math.floor(value / 3600) : null);
      setMinutes(value ? Math.floor((value % 3600) / 60) : null);
    },
    { immediate: true },
  );

  /* WF4-REVIEW [J] */ watch([hours, minutes], () => {
    seconds = toSeconds();
  });

  return (
    <>
  <div>
    {(label) ? (
      <div className="text-caption opacity-80">
        {label}
      </div>
    ) : null}
    <div className="d-flex flex-wrap align-center" style="gap: 0 1rem">
      {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
      <VNumberInput value={hours} onChange={setHours} min={0} max={MAX_HOURS} precision={0} suffix={durationUnitLabel('hour')} variant="underlined" density="compact" inset className="time-input" />
      {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
      <VNumberInput value={minutes} onChange={setMinutes} min={0} precision={0} suffix={durationUnitLabel('minute')} variant="underlined" density="compact" inset className="time-input" />
      {(!hideText) ? (
        /* WF4-REVIEW: rules/error-messages → error+helperText */
        <TextField value={text} onChange={/* WF4-REVIEW: setter */ setText} density="compact" variant="underlined" className="time-text" />
      ) : null}
    </div>
  </div>
    </>
  );
}
