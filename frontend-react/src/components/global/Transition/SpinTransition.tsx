export default function SpinTransition() {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  defineProps<{}>();

  return (
    <>
  <TransitionGroup name="spin" appear>
    <slot />
  </TransitionGroup>
    </>
  );
}
