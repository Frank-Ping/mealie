import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Tooltip } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import RecipeTimeline from "./RecipeTimeline";

interface Props {
  buttonStyle?: boolean;
  slug?: string;
  recipeName?: string;
}

export default function RecipeTimelineBadge({ buttonStyle = false, slug = "", recipeName = "" }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const [showTimeline, setShowTimeline] = useState(false);

  function toggleTimeline() {
    setShowTimeline(!showTimeline);
  }

  const timelineAttrs = useMemo(() => {
    return {
      queryFilter: `recipe.slug="${slug}"`,
    };
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  {/* WF4-REVIEW: activator slot variants [J] */}
  <Tooltip location="bottom" nudge-right="50" color={buttonStyle ? 'info' : 'secondary'}>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      <Button icon variant={buttonStyle ? 'flat' : undefined} rounded={buttonStyle ? 'circle' : undefined} size="small" color={buttonStyle ? 'info' : 'secondary'} fab={buttonStyle} {...({ ...activatorProps, ...$attrs })} onClick={(e) => { e.preventDefault(); toggleTimeline; }}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.timelineText} size={!buttonStyle ? undefined : 'x-large'} color={buttonStyle ? 'white' : 'secondary'} />
      </Button>
      <BaseDialog value={showTimeline} onChange={setShowTimeline} title={t('recipe.timeline')} icon={icons.timelineText} width="70%">
        <RecipeTimeline value={showTimeline} onChange={setShowTimeline} query-filter={timelineAttrs.queryFilter} />
      </BaseDialog>
    </>
    <span>
      {t('recipe.open-timeline')}
    </span>
  </Tooltip>
    </>
  );
}
