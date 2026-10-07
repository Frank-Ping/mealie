import { useMemo, useState } from "react";
import { Avatar, Box, Tooltip } from "@mui/material";
import { useUserStore } from "@/composables/store/use-user-store";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  userId: string;
  list?: boolean;
  size?: string;
  tooltip?: boolean;
}

export default function UserAvatar({ userId, list = false, size = "42", tooltip = true }: Props) {
  const props = /* props via generated interface + destructured signature */

  const [error, setError] = useState(false);

  const auth = useMealieAuth();
  const { store: users } = useUserStore();
  const user = useMemo(() => {
    return users.find(user => user.id === userId);
  }, []); // WF4-REVIEW: dependency array

  const imageURL = useMemo(() => {
    // Note: auth.user is a ref now
    const authUser = auth.user;
    const key = authUser?.cacheKey ?? "";
    return `/api/media/users/${userId}/profile.webp?cacheKey=${key}`;
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  {(userId) ? (
    /* WF4-REVIEW: activator slot variants [J] */
    <Tooltip disabled={!user || !tooltip} location="end">
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(list) ? (
          <Avatar {...(tooltipProps)}>
            {/* WF4-REVIEW: cover → objectFit */}
            <Box component="img" src={imageURL} alt={userId} onLoad={() => setError(false)} onError={() => setError(true)} />
          </Avatar>
        ) : (
          <Avatar size={size} {...(tooltipProps)}>
            {/* WF4-REVIEW: cover → objectFit */}
            <Box component="img" src={imageURL} alt={userId} onLoad={() => setError(false)} onError={() => setError(true)} />
          </Avatar>
        )}
      </>
      {(user) ? (
        <span>
          {user.fullName}
        </span>
      ) : null}
    </Tooltip>
  ) : null}
    </>
  );
}
