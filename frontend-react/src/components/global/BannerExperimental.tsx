import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  issue?: string;
}

export default function BannerExperimental({ issue = "" }: Props) {
  const { t } = useTranslation();

  /* props via generated interface + destructured signature */

  return (
    <>
  <BannerWarning title={t('banner-experimental.title')} description={t('banner-experimental.description')}>
    {(issue) ? (
      /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
      <>
        <a to={issue} target="_blank" color="primary">
          {t("banner-experimental.issue-link-text")}
        </a>
      </>
    ) : null}
  </BannerWarning>
    </>
  );
}
