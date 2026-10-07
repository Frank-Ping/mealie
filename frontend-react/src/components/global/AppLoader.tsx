import { useMemo } from "react";
import { CircularProgress } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

interface Props {
  loading?: boolean;
  tiny?: boolean;
  small?: boolean;
  medium?: boolean;
  large?: boolean;
  waitingText?: string;
}

export default function AppLoader({ loading = true, tiny = false, small = false, medium = true, large = false, waitingText = undefined }: Props) {
  const props = /* props via generated interface + destructured signature */

  const size = useMemo(() =>  {
    if (tiny, []); // WF4-REVIEW: dependency array {
      return {
        width: 2,
        icon: 0,
        size: 25,
      };
    }
    if (small) {
      return {
        width: 2,
        icon: 30,
        size: 50,
      };
    }
    else if (large) {
      return {
        width: 4,
        icon: 120,
        size: 200,
      };
    }
    return {
      width: 3,
      icon: 75,
      size: 125,
    };
  });

  const i18n = useI18n();
  const waitingTextCalculated = waitingText == null ? i18n.t("general.loading") : waitingText;

  return (
    <>
  <div className="mx-auto my-3 justify-center" style="display: flex;">
    <div className="text-center">
      <CircularProgress width={size.width} size={size.size} color="primary-lighten-2" indeterminate>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={$globals.icons.primary} size={size.icon} color="primary-lighten-2" />
      </CircularProgress>
      <div className={large ? 'text-title-large mt-5' : 'text-body-large mt-3'}>
        <slot>
          {(small || tiny) ? "" : waitingTextCalculated}
        </slot>
      </div>
    </div>
  </div>
    </>
  );
}
