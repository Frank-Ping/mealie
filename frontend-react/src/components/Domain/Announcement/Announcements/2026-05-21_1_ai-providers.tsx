import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import { useGroupSelf } from "@/composables/use-groups";
import type { AnnouncementMeta } from "@/composables/use-announcements";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function 202605211AiProviders() {
  const { t } = useTranslation();

  const { user } = useMealieAuth();
  const { group } = useGroupSelf();

  return (
    <>
  <div>
    <p>
      AI providers can now be configured directly in Mealie, without managing environment variables or secrets.
    </p>
    <div className="mb-2">
      AI providers enable features such as:
      <ul className="ml-6">
        <li>
          Creating recipes from images
        </li>
        <li>
          Importing recipes from videos (YouTube, TikTok, etc.)
        </li>
        <li>
          Enhanced ingredient parsing
        </li>
        <li>
          And more!
        </li>
      </ul>
    </div>
    <hr className="mt-2 mb-4" />
    <p>
      {(group?.aiProviderSettings?.aiEnabled) ? (
        <span>
          Your group already has AI providers configured.
        </span>
      ) : (
        <span>
          Your group does not currently have any AI providers configured.
        </span>
      )}
      {(user?.canManage) ? (
        <span>
          You can manage them here:
          <br />
          <Button className="mt-2" color="primary" to="/group">
            {t("profile.group-settings")}
          </Button>
        </span>
      ) : (!group?.aiProviderSettings?.aiEnabled) ? (
        <span>
          Contact a group manager or server admin to set up AI providers for your group.
        </span>
      ) : null}
    </p>
    {(user?.admin) ? (
      <div>
        <br />
        <p>
          As an admin, you can configure AI providers for any group. Unlike the old environment variable approach, providers are configured per-group:
          <br />
          <Button className="mt-2" color="primary" to="/admin/manage/groups">
            {t("group.admin-group-management")}
          </Button>
        </p>
      </div>
    ) : null}
  </div>
    </>
  );
}
