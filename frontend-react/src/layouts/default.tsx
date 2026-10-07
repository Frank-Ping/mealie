import DefaultLayout from "@/components/Layout/DefaultLayout";
import { useGlobalI18n } from "@/composables/use-global-i18n";

export default function Default() {
  useGlobalI18n(); // ensure i18n is initialized

  return (
    <>
  <DefaultLayout />
    </>
  );
}
