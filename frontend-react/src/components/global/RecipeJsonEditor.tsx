import JsonEditorVue from "json-editor-vue";

interface Props {
  height?: string;
}

export default function RecipeJsonEditor({ height = "1500px" }: Props) {
  const modelValue = defineModel<object>("modelValue", { default: () => ({}) });
  /* props via generated interface + destructured signature */

  function parseEvent(event: any): object {
    if (!event) {
      return modelValue || {};
    }
    try {
      if (event.json) {
        return event.json;
      }
      else if (event.text) {
        return JSON.parse(event.text);
      }
      else {
        return event;
      }
    }
    catch {
      return modelValue || {};
    }
  }
  function onChange(event: any) {
    const parsed = parseEvent(event);
    if (parsed !== modelValue) {
      modelValue = parsed;
    }
  }

  return (
    <>
  <JsonEditorVue model-value={modelValue} {...($attrs)} style={{ height }} stringified={false} onChange={onChange} />
    </>
  );
}
