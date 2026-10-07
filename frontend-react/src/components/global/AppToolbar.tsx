import { useTranslation } from "react-i18next";
import { Toolbar } from "@mui/material";

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
      <template>
        {$globals.icons.arrowLeftBold}
      </template>
      {t('general.back')}
    </BaseButton>
    <slot />
  </Toolbar>
    </>
  );
}
