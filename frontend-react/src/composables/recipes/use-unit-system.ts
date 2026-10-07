import { useMemo } from "react";
import { useLocalStorage } from "@vueuse/core";
import type { UnitSystem } from "./unit-systems";

/**
 * The unit system recipes are displayed in, or null to show them exactly as they were written.
 *
 * Null is the default and stays the default: a recipe reads as its author typed it until the
 * reader opts in. Nothing is inferred from their locale, because guessing wrong silently
 * rewrites every quantity on the page.
 *
 * Stored per browser rather than on the account — there's no household or user setting for
 * this, so it doesn't sync across devices.
 */
export function useUnitSystem() {
  const preference = useLocalStorage<{ unitSystem: UnitSystem | null }>(
    "recipe-unit-system-preferences",
    { unitSystem: null },
    { mergeDefaults: true },
  );

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const unitSystem = computed({
    get: () => preference.unitSystem,
    set: (value) => {
      preference.unitSystem = value;
    },
  });

  /** Whether quantities are being rewritten at all, as opposed to shown as authored. */
  const isConverting = useMemo(() => unitSystem !== null, []); // WF4-REVIEW: dependency array

  function showAsWritten() {
    preference.unitSystem = null;
  }

  return { unitSystem, isConverting, showAsWritten };
}
