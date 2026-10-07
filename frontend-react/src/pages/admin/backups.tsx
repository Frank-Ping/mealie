import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, CardContent, Container, Divider, FormControlLabel, LinearProgress, Toolbar } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useAdminApi } from "@/composables/api";
import type { AllBackups } from "@/lib/api/types/admin";
import { alert } from "@/composables/use-toast";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Backups() {
  const { t } = useTranslation();

  const i18n = useI18n();

  const adminApi = useAdminApi();
  const [selected, setSelected] = useState("");

  const [backups, setBackups] = useState({
    imports: [],
    templates: [],
  });

  async function refreshBackups() {
    const { data } = await adminApi.backups.getAll();
    if (data) {
      setBackups(data);
    }
  }

  async function createBackup() {
    state.runningBackup = true;
    const { data } = await adminApi.backups.create();

    if (data?.error === false) {
      refreshBackups();
      alert.success(i18n.t("settings.backup.backup-created"));
    }
    else {
      alert.error(i18n.t("settings.backup.error-creating-backup-see-log-file"));
    }
    state.runningBackup = false;
  }

  async function restoreBackup(fileName: string) {
    state.runningRestore = true;
    const { error } = await adminApi.backups.restore(fileName);

    if (error) {
      console.log(error);
      state.importDialog = false;
      state.runningRestore = false;
      alert.error(i18n.t("settings.backup.restore-fail"));
    }
    else {
      alert.success(i18n.t("settings.backup.restore-success"));
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }

  const [deleteTarget, setDeleteTarget] = useState("");

  async function deleteBackup() {
    const { data } = await adminApi.backups.delete(deleteTarget);

    if (!data?.error) {
      alert.success(i18n.t("settings.backup.backup-deleted"));
      refreshBackups();
    }
  }

  const state = /* WF4-REVIEW [J] */ reactive({
    confirmImport: false,
    deleteDialog: false,
    createDialog: false,
    importDialog: false,
    runningBackup: false,
    runningRestore: false,
    search: "",
    headers: [
      { title: i18n.t("general.name"), value: "name" },
      { title: i18n.t("general.created"), value: "date" },
      { title: i18n.t("export.size"), value: "size" },
      { title: "", value: "actions", align: "right" },
    ],
  });

  function setSelected(data: { name: string; date: string }) {
    if (!data.name) {
      return;
    }
    setSelected(data.name);
  }

  const backupsFileNameDownload = (fileName: string) => `api/admin/backups/${fileName}`;

  useSeoMeta({
    title: i18n.t("sidebar.backups"),
  });

  /* WF4-REVIEW [J] */ onMounted(refreshBackups);

  useHead({
    title: i18n.t("sidebar.backups"),
  });

  return (
    <>
  <Container fluid>
    <section>
      {/* WF4-REVIEW: v-model on complex expression "state.deleteDialog" [J] */}
      <BaseDialog {/* WF4-REVIEW: v-model state.deleteDialog */} bottom-sheet title={t('settings.backup.delete-backup')} color="error" icon={$globals.icons.alertCircle} can-confirm onConfirm={deleteBackup()}>
        <CardContent>
          {t("general.confirm-delete-generic")}
        </CardContent>
      </BaseDialog>
      {/* WF4-REVIEW: v-model on complex expression "state.importDialog" [J] */}
      <BaseDialog {/* WF4-REVIEW: v-model state.importDialog */} bottom-sheet color="error" title={t('settings.backup.backup-restore')} icon={$globals.icons.database}>
        <Divider />
        <CardContent>
          <i18n-t keypath="settings.backup.back-restore-description">
            <template>
              <b>
                {t('settings.backup.cannot-be-undone')}
              </b>
            </template>
          </i18n-t>
          <p className="mt-3">
            <i18n-t keypath="settings.backup.postgresql-note">
              <template>
                <a className="text-primary" href="https://nightly.mealie.io/documentation/getting-started/usage/backups-and-restoring/">
                  {t('settings.backup.backup-restore-process-in-the-documentation')}
                </a>
              </template>
            </i18n-t>
          </p>
          {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "state.confirmImport" [J] */}
          <FormControlLabel {/* WF4-REVIEW: v-model state.confirmImport */} className="checkbox-top" color="error" hide-details label={t('settings.backup.irreversible-acknowledgment')} />
        </CardContent>
        <template>
          <BaseButton delete disabled={!state.confirmImport || state.runningRestore} onClick={restoreBackup(selected)}>
            <template>
              {$globals.icons.database}
            </template>
            {t('settings.backup.restore-backup')}
          </BaseButton>
        </template>
        <p className="caption pb-0 mb-1 text-center">
          {selected}
        </p>
        {(state.runningRestore) ? (
          <LinearProgress indeterminate />
        ) : null}
      </BaseDialog>
      <section>
        <BaseCardSectionTitle title={t('settings.backup-and-exports')}>
          <CardContent className="py-0 px-1">
            <i18n-t keypath="settings.backup.experimental-description" />
          </CardContent>
        </BaseCardSectionTitle>
        <Toolbar color="transparent" flat className="justify-between">
          <BaseButton className="mr-2" loading={state.runningBackup} onClick={createBackup}>
            {t("settings.backup.create-heading")}
          </BaseButton>
          <AppButtonUpload text-btn={false} url="/api/admin/backups/upload" accept=".zip" color="info" onUploaded={refreshBackups()} />
        </Toolbar>
        {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
        <VDataTable headers={state.headers} items={backups.imports || []} className="elevation-0" items-per-page={-1} hide-default-footer disable-pagination search={state.search} onClickRow={setSelected}>
          <template>
            {$d(Date.parse(item.date))}
          </template>
          <template>
            <Button icon className="mx-1" color="error" variant="text" onClick={(e) => { e.stopPropagation(); state.deleteDialog = true;
                deleteTarget = item.name;; }}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={$globals.icons.delete} />
            </Button>
            <BaseButton small download download-url={backupsFileNameDownload(item.name)} className="mx-1" onClick={(e) => { e.stopPropagation(); { }; }} />
            <BaseButton small onClick={(e) => { e.stopPropagation(); setSelected(item); state.importDialog = true; }}>
              <template>
                {$globals.icons.backupRestore}
              </template>
              {t("settings.backup.backup-restore")}
            </BaseButton>
          </template>
        </VDataTable>
        <Divider />
        <div className="d-flex justify-end mt-6">
          <div />
        </div>
      </section>
    </section>
    <Container className="mt-4 d-flex justify-center text-center">
      <nuxt-link className="text-primary" to={`/group/migrations`}>
        {t('recipe.looking-for-migrations')}
      </nuxt-link>
    </Container>
  </Container>
    </>
  );
}
