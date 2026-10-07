import { Alert } from "@mui/material";

interface Props {
  title?: string;
  description?: string;
}

export default function BannerWarning({ title = "", description = "" }: Props) {
  /* props via generated interface + destructured signature */

  return (
    <>
  <Alert border="start" variant="tonal" type="warning" elevation="2" icon={$globals.icons.alert}>
    {(title) ? (
      <b>
        {title}
      </b>
    ) : null}
    {(description) ? (
      <div>
        {description}
      </div>
    ) : null}
    {($slots.default) ? (
      <div className="py-2">
        <slot />
      </div>
    ) : null}
  </Alert>
    </>
  );
}
