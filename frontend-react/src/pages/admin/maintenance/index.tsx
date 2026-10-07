import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Container, Divider, ListItem, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
import { useAdminApi } from "@/composables/api";
import type { MaintenanceStorageDetails, MaintenanceSummary } from "@/lib/api/types/admin";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function MaintenancePage() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    storageDetails: false,
    storageDetailsLoading: false,
    fetchingInfo: false,
    actionLoading: false,
  });

  const adminApi = useAdminApi();
  const { i18n } = useTranslation();

  // Set page title
  useSeoMeta({
    title: i18n.t("admin.maintenance.page-title"),
  });

  // ==========================================================================
  // General Info

  const [infoResults, setInfoResults] = useState({
    dataDirSize: i18n.t("about.unknown-version"),
    cleanableDirs: 0,
    cleanableImages: 0,
  });

  async function getSummary() {
    state.fetchingInfo = true;
    const { data } = await adminApi.maintenance.getInfo();

    setInfoResults(data ?? {
      dataDirSize: i18n.t("about.unknown-version"),
      cleanableDirs: 0,
      cleanableImages: 0,
    });

    state.fetchingInfo = false;
  }

  const info = useMemo(() => {
    return [
      {
        name: i18n.t("admin.maintenance.info-description-data-dir-size"),
        value: infoResults.dataDirSize,
      },
      {
        name: i18n.t("admin.maintenance.info-description-cleanable-directories"),
        value: infoResults.cleanableDirs,
      },
      {
        name: i18n.t("admin.maintenance.info-description-cleanable-images"),
        value: infoResults.cleanableImages,
      },
    ];
  }, []); // WF4-REVIEW: dependency array

  // ==========================================================================
  // Storage Details

  const storageTitles: { [key: string]: string } = {
    tempDirSize: i18n.t("admin.maintenance.storage.title-temporary-directory") as string,
    backupsDirSize: i18n.t("admin.maintenance.storage.title-backups-directory") as string,
    groupsDirSize: i18n.t("admin.maintenance.storage.title-groups-directory") as string,
    recipesDirSize: i18n.t("admin.maintenance.storage.title-recipes-directory") as string,
    userDirSize: i18n.t("admin.maintenance.storage.title-user-directory") as string,
  };

  function storageDetailsText(key: string) {
    return storageTitles[key] ?? i18n.t("about.unknown-version");
  }

  const [storageDetails, setStorageDetails] = useState(null);

  async function openDetails() {
    state.storageDetailsLoading = true;
    state.storageDetails = true;

    const { data } = await adminApi.maintenance.getStorageDetails();

    if (data) {
      setStorageDetails(data);
    }

    state.storageDetailsLoading = true;
  }

  // ==========================================================================
  // Actions

  async function handleCleanDirectories() {
    state.actionLoading = true;
    await adminApi.maintenance.cleanRecipeFolders();
    state.actionLoading = false;
  }

  async function handleCleanImages() {
    state.actionLoading = true;
    await adminApi.maintenance.cleanImages();
    state.actionLoading = false;
  }

  async function handleCleanTemp() {
    state.actionLoading = true;
    await adminApi.maintenance.cleanTemp();
    state.actionLoading = false;
  }

  const actions = [
    {
      name: i18n.t("admin.maintenance.action-clean-directories-name"),
      handler: handleCleanDirectories,
      subtitle: i18n.t("admin.maintenance.action-clean-directories-description"),
    },
    {
      name: i18n.t("admin.maintenance.action-clean-temporary-files-name"),
      handler: handleCleanTemp,
      subtitle: i18n.t("admin.maintenance.action-clean-temporary-files-description"),
    },
    {
      name: i18n.t("admin.maintenance.action-clean-images-name"),
      handler: handleCleanImages,
      subtitle: i18n.t("admin.maintenance.action-clean-images-description"),
    },
  ];

  return (
    <>
  <Container fluid className="narrow-container">
    {/* WF4-REVIEW: v-model on complex expression "state.storageDetails" [J] */}
    <BaseDialog bottom-sheet title={t('admin.maintenance.storage-details')} icon={icons.folderOutline}>
      <div className="py-2">
        {storageDetails.map((value, key, idx) => (
          <>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem>
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText>
                <div>
                  {storageDetailsText(key)}
                </div>
              </ListItemText>
              {/* WF4-REVIEW: content → secondary prop */}
              <ListItemText className="text-end">
                {value}
              </ListItemText>
            </ListItem>
            {(idx != 4) ? (
              <Divider key={`divider-${key}`} className="mx-2" />
            ) : null}
          </>
        ))}
      </div>
    </BaseDialog>
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t("admin.maintenance.page-title")}
      </>
    </BasePageTitle>
    <section>
      <BaseCardSectionTitle className="pb-0" icon={icons.wrench} title={t('admin.maintenance.summary-title')} />
      <div className="mb-6 d-flex" style="gap: 0.3rem">
        <BaseButton color="info" onClick={getSummary}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {icons.tools}
          </>
          {t("admin.maintenance.button-label-get-summary")}
        </BaseButton>
        <BaseButton color="info" onClick={openDetails}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {icons.folderOutline}
          </>
          {t("admin.maintenance.button-label-open-details")}
        </BaseButton>
      </div>
      <Card className="" loading={state.fetchingInfo}>
        {info.map((value, idx) => (
          <>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem>
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText className="py-2">
                <div>
                  {value.name}
                </div>
                {/* WF4-REVIEW: content → secondary prop */}
                <ListItemText className="text-end">
                  {value}
                </ListItemText>
              </ListItemText>
            </ListItem>
            <Divider className="mx-2" />
          </>
        ))}
      </Card>
    </section>
    <section>
      <BaseCardSectionTitle className="pb-0 mt-8" icon={icons.wrench} title={t('admin.mainentance.actions-title')}>
        <i18n-t keypath="admin.maintenance.actions-description">
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <b>
              {t("admin.maintenance.actions-description-destructive")}
            </b>
          </>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <b>
              {t("admin.maintenance.actions-description-irreversible")}
            </b>
          </>
        </i18n-t>
      </BaseCardSectionTitle>
      <Card className="ma-0" flat loading={state.actionLoading}>
        {actions.map((action, idx) => (
          <>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem className="py-2 px-0">
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText>
                <div>
                  {action.name}
                </div>
                {/* WF4-REVIEW: content → secondary prop */}
                <ListItemText className="wrap-word">
                  {action.subtitle}
                </ListItemText>
              </ListItemText>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                <BaseButton color="info" onClick={action.handler}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.robot}
                  </>
                  {t("general.run")}
                </BaseButton>
              </>
            </ListItem>
            <Divider className="mx-2" />
          </>
        ))}
      </Card>
    </section>
  </Container>
    </>
  );
}
