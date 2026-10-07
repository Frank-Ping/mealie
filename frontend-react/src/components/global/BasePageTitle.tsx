import { Divider } from "@mui/material";

interface Props {
  divider?: boolean;
}

export default function BasePageTitle({ divider = false }: Props) {
  /* props via generated interface + destructured signature */

  return (
    <>
  <div className="mt-4">
    <section className="d-flex flex-column align-center">
      <slot name="header" />
      <h2 className="text-h5">
        <slot name="title">
          👋 Here's a Title
        </slot>
      </h2>
      <h3 className="subtitle-1">
        <slot />
      </h3>
    </section>
    <section className="d-flex">
      <slot name="content" />
    </section>
    {(divider) ? (
      <Divider className="my-4" />
    ) : null}
  </div>
    </>
  );
}
