import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function AdvancedOnly() {
  /**
   * Renderless component that only renders if the user is logged in.
   * and has advanced options toggled.
   */
  const auth = useMealieAuth();

  const advanced = auth.user?.advanced || false;

  return (
    <>
  {(advanced) ? (
    <slot />
  ) : null}
    </>
  );
}
