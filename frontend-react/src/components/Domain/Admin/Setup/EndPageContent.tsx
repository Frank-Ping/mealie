import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar, Card, CardHeader, Container, Typography } from "@mui/material";
import { icons } from "@/lib/icons";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function EndPageContent() {
  const { t } = useTranslation();

  const i18n = useI18n();
  const auth = useMealieAuth();
  const groupSlug = auth.user?.groupSlug; // was computed — plain read stays reactive
  // icons imported directly (was $globals)

  const [sections, setSections] = useState([
    {
      title: i18n.t("profile.data-migrations");,
      color: "info",
      links: [
        {
          icon: icons.backupRestore,
          to: "/admin/backups",
          text: i18n.t("settings.backup.backup-restore"),
          description: i18n.t("admin.setup.restore-from-v1-backup"),
        },
        {
          icon: icons.import,
          to: "/group/migrations",
          text: i18n.t("migration.recipe-migration"),
          description: i18n.t("migration.migration-description"),
        },
      ],
    },
    {
      title: i18n.t("recipe.create-recipes"),
      color: "success",
      links: [
        {
          icon: icons.createAlt,
          to: computed(() => `/g/${groupSlug || ""}/r/create/new`),
          text: i18n.t("recipe.create-recipe"),
          description: i18n.t("recipe.create-recipe-description"),
        },
        {
          icon: icons.link,
          to: computed(() => `/g/${groupSlug || ""}/r/create/url`),
          text: i18n.t("recipe.import-with-url"),
          description: i18n.t("recipe.scrape-recipe-description"),
        },
      ],
    },
    {
      title: i18n.t("user.manage-users"),
      color: "primary",
      links: [
        {
          icon: icons.group,
          to: "/admin/manage/users",
          text: i18n.t("user.manage-users"),
          description: i18n.t("user.manage-users-description"),
        },
        {
          icon: icons.user,
          to: "/user/profile",
          text: i18n.t("profile.manage-user-profile"),
          description: i18n.t("admin.setup.manage-profile-or-get-invite-link"),
        },
      ],
    },
  ]);

  return (
    <>
  <Container max-width="880" className="end-page-content">
    <div className="d-flex flex-column ga-6">
      <div>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="text-h4 justify-center">
          {t('admin.setup.setup-complete')}
        </CardHeader>
        {/* WF4-REVIEW: or CardHeader subheader */}
        <Typography variant="body2" color="text.secondary" className="justify-center">
          {t('admin.setup.here-are-a-few-things-to-help-you-get-started')}
        </Typography>
      </div>
      {/* WF4-REVIEW: unparseable v-for "section, idx in sections" */}
        <div key={idx} className="d-flex flex-column ga-3">
          {/* WF4-REVIEW: title text moves to the title prop */}
          <CardHeader className="text-h6 pl-0">
            {section.title}
          </CardHeader>
          <div className="sections d-flex flex-column ga-2">
            {/* WF4-REVIEW: unparseable v-for "link, linkIdx in section.links" */}
              <Card key={linkIdx} clas="link-card" to={link.to} title={link.text} subtitle={link.description} append-icon={$globals.icons.chevronRight}>
                <template>
                  <Avatar icon={link.icon || undefined} variant="tonal" color={section.color} />
                </template>
              </Card>
          </div>
        </div>
    </div>
  </Container>
    </>
  );
}
