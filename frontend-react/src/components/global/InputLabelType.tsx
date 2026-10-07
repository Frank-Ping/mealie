import { useState } from "react";
import { Autocomplete } from "@mui/material";
import { icons } from "@/lib/icons";
import type { MultiPurposeLabelSummary } from "@/lib/api/types/labels";
import type { IngredientFood, IngredientUnit } from "@/lib/api/types/recipe";
import { useSearch } from "@/composables/use-search";

interface Props {
  items: unknown[];
  icon?: string;
  create?: boolean;
  search?: boolean;
}

export default function InputLabelType({ items, icon = undefined, create = false, search = false }: Props) {
  // v-model for the selected item
  const modelValue = defineModel<MultiPurposeLabelSummary | IngredientFood | IngredientUnit | null>({ default: () => null });

  // support v-model:item-id binding
  const itemId = defineModel<string | null | undefined>("item-id", { default: undefined });

  const props = /* props via generated interface + destructured signature */

  const emit = defineEmits<{
    (e: "create", val: string): void;
  }>();

  const [autocompleteRef, setAutocompleteRef] = useState(undefined);

  // Use the search composable
  const { search: searchInput, filtered: filteredItems } = useSearch(computed(() => items));

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const itemVal = computed({
    get: () => {
      if (!modelValue || Object.keys(modelValue).length === 0) {
        return null;
      }
      return modelValue;
    },
    set: (val) => {
      itemId = val?.id ?? null;
      modelValue = val;
    },
  });

  function emitCreate() {
    if (items.some(item => item.name === searchInput)) {
      return;
    }
    emit("create", searchInput);
    autocompleteRef?.blur();
  }

  defineExpose({
    focus: () => autocompleteRef?.focus(),
  });

  return (
    <>
  {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
  <Autocomplete ref="autocompleteRef" value={itemVal} onChange={/* WF4-REVIEW: setter */ setItemVal} {...($attrs)} value={searchInput} onChange={/* WF4-REVIEW: setter */ setSearchInput} item-title="name" return-object items={filteredItems} prepend-inner-icon={icon || (search ? icons.search : icons.tags)} menu-icon={search ? '' : undefined} rounded={search ? true : '4px'} custom-filter={() => true} variant={search ? 'solo-filled' : undefined} color="primary" auto-select-first clearable hide-details onKeyUp={emitCreate}>
    {(create) ? (
      /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
      <>
        <div className="px-2">
          <BaseButton block size="small" onClick={emitCreate} />
        </div>
      </>
    ) : null}
  </Autocomplete>
    </>
  );
}
