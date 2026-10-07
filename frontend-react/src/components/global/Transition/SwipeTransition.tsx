export default function SwipeTransition({ group = false }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<?>) */

  return (
    <>
  {(group) ? (
    <TransitionGroup name={`swipe-${direction}`} appear className="overflow-x-hidden-child">
      <slot />
    </TransitionGroup>
  ) : (
    <Transition name={`swipe-${direction}`} mode="out-in" appear className="overflow-x-hidden-child">
      <slot />
    </Transition>
  )}
    </>
  );
}
