import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import type { AnnouncementMeta } from "@/composables/use-announcements";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function 202603271Welcome() {
  const { t } = useTranslation();

  const { user } = useMealieAuth();

  return (
    <>
  <div>
    <p>
      Welcome to Mealie! If this is your first time seeing announcements, here's what to expect.
    </p>
    <div className="mb-2">
      Announcements are reserved for things like:
      <ul className="ml-6">
        <li>
          Important new features
        </li>
        <li>
          Major changes
        </li>
        <li>
          Anything that might require additional user actions (such as migration scripts)
        </li>
      </ul>
    </div>
    <p>
      While we generally keep everything in our
      <a className="text-primary" href="https://github.com/mealie-recipes/mealie/releases" target="_blank">
        GitHub release notes
      </a>
      , sometimes certain changes require some extra attention.
    </p>
    <p>
      Announcements are English-only; they're one-off messages from the maintainers, not a replacement for our release notes. Some elements may still be translated.
    </p>
    <hr className="mt-2 mb-4" />
    <p>
      You can opt out of announcements in your user settings:
      <br />
      <Button className="mt-2" color="primary" to="/user/profile/edit">
        {t("profile.user-settings")}
      </Button>
    </p>
    {(user?.canManageHousehold) ? (
      <p className="mt-3">
        As
        {user?.admin ? "an admin" : "a household manager"}
        , you can disable announcements for your entire household:
        <br />
        <Button className="mt-2" color="primary" to="/household">
          {t("profile.household-settings")}
        </Button>
      </p>
    ) : null}
    {(user?.canManage) ? (
      <p className="mt-3">
        {user?.admin ? "You can also" : "As a group manager, you can"}
        disable announcements for your entire group:
        <br />
        <Button className="mt-2" color="primary" to="/group">
          {t("profile.group-settings")}
        </Button>
      </p>
    ) : null}
  </div>
    </>
  );
}
