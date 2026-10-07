export default function RecipeIngredientEditorLayout() {
  defineProps<{ header: boolean }>();

  return (
    <>
  {(header) ? (
    <div className="d-flex pt-2 align-center">
      <slot name="dragHandle" />
      {(!$vuetify.display.mdAndDown) ? (
        <slot name="form" />
      ) : null}
      <slot name="contextMenu" />
    </div>
  ) : (!$vuetify.display.mdAndDown) ? (
    <slot name="form" />
  ) : null}
  {($vuetify.display.mdAndDown) ? (
    <slot name="form" />
  ) : null}
    </>
  );
}
