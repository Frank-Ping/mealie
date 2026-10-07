import { useTranslation } from "react-i18next";
import { Toolbar } from "@mui/material";
import { icons } from "@/lib/icons";

interface Props {
  back?: boolean;
}

export default function AppToolbar({ back = false }: Props) {
  const { t } = useTranslation();

  /* props via generated interface + destructured signature */

  return (
    <>
  <Toolbar color="transparent" flat>
    <BaseButton color="null" rounded secondary onClick={$router.go(-1)}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {icons.arrowLeftBold}
      </>
      {t('general.back')}
    </BaseButton>
    <slot />
  </Toolbar>
    </>
  );
}
