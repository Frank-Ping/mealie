interface Props {
  tag?: string;
}

export default function ToggleState({ tag = "div" }: Props) {
  const modelValue = defineModel({
    type: Boolean,
    default: false,
  });

  /* props via generated interface + destructured signature */

  const toggle = () => {
    modelValue = !modelValue;
  };

  return (
    <>
  <component is={tag}>
    <slot name="activator" {...({ toggle, modelValue })} />
    <slot {...({ modelValue, toggle })} />
  </component>
    </>
  );
}
