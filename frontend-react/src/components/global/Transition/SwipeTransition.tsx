export default function SwipeTransition() {
  withDefaults(defineProps<{
    direction: "left" | "right";
    group?: boolean;
  }>(), {
    group: false,
  });

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
