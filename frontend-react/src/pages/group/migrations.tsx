import { useTranslation } from "react-i18next";
import { Box, Card, CardActions, CardContent, CardHeader, Container, FormControlLabel } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import type { ReportSummary } from "@/lib/api/types/reports";
import type { MenuItem } from "@/components/global/BaseOverflowButton";
import { useUserApi } from "@/composables/api";
import type { SupportedMigrations } from "@/lib/api/types/group";

export const handle = {
  middleware: ["auth", "advanced-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

interface TreeNode {
  id?: number;
  icon: string;
  title: string;
  children?: TreeNode[];
}

interface MigrationContent {
  text: string;
  acceptedFileType: string;
  tree: TreeNode[] | false;
}

export default function Migrations() {
  const { t } = useTranslation();

  const MIGRATIONS = {
    mealie: "mealie_alpha",
    chowdown: "chowdown",
    copymethat: "copymethat",
    myrecipebox: "myrecipebox",
    nextcloud: "nextcloud",
    paprika: "paprika",
    plantoeat: "plantoeat",
    recipekeeper: "recipekeeper",
    tandoor: "tandoor",
    cookn: "cookn",
  };



  const i18n = useI18n();
  // icons imported directly (was $globals)

  useSeoMeta({
    title: i18n.t("settings.migrations"),
  });

  const api = useUserApi();

  const state = /* WF4-REVIEW [J] */ reactive({
    addMigrationTag: false,
    loading: false,
    treeState: true,
    migrationType: MIGRATIONS.mealie as SupportedMigrations,
    fileObject: {} as File,
    reports: [] as ReportSummary[],
  });

  const items: MenuItem[] = [
    {
      text: i18n.t("migration.mealie-pre-v1.title"),
      value: MIGRATIONS.mealie,
      divider: true,
    },
    {
      text: i18n.t("migration.chowdown.title"),
      value: MIGRATIONS.chowdown,
    },
    {
      text: i18n.t("migration.copymethat.title"),
      value: MIGRATIONS.copymethat,
    },
    {
      text: i18n.t("migration.myrecipebox.title"),
      value: MIGRATIONS.myrecipebox,
    },
    {
      text: i18n.t("migration.nextcloud.title"),
      value: MIGRATIONS.nextcloud,
    },
    {
      text: i18n.t("migration.paprika.title"),
      value: MIGRATIONS.paprika,
    },
    {
      text: i18n.t("migration.plantoeat.title"),
      value: MIGRATIONS.plantoeat,
    },
    {
      text: i18n.t("migration.recipekeeper.title"),
      value: MIGRATIONS.recipekeeper,
    },
    {
      text: i18n.t("migration.tandoor.title"),
      value: MIGRATIONS.tandoor,
    },
    {
      text: i18n.t("migration.cookn.title"),
      value: MIGRATIONS.cookn,
    },
  ];
  const _content: Record<string, MigrationContent> = {
    [MIGRATIONS.mealie]: {
      text: i18n.t("migration.mealie-pre-v1.description-long"),
      acceptedFileType: ".zip",
      tree: [
        {
          icon: icons.zip,
          title: "mealie.zip",
          children: [
            {
              title: "recipes",
              icon: icons.folderOutline,
              children: [
                {
                  title: "recipe-name",
                  icon: icons.folderOutline,
                  children: [
                    { title: "recipe-name.json", icon: icons.codeJson },
                    {
                      title: "images",
                      icon: icons.folderOutline,
                      children: [
                        { title: "original.webp", icon: icons.codeJson },
                        { title: "full.jpg", icon: icons.fileImage },
                        { title: "thumb.jpg", icon: icons.fileImage },
                      ],
                    },
                  ],
                },
                {
                  title: "recipe-name-1",
                  icon: icons.folderOutline,
                  children: [
                    { title: "recipe-name-1.json", icon: icons.codeJson },
                    {
                      title: "images",
                      icon: icons.folderOutline,
                      children: [
                        { title: "original.webp", icon: icons.codeJson },
                        { title: "full.jpg", icon: icons.fileImage },
                        { title: "thumb.jpg", icon: icons.fileImage },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    [MIGRATIONS.chowdown]: {
      text: i18n.t("migration.chowdown.description-long"),
      acceptedFileType: ".zip",
      tree: [
        {
          icon: icons.zip,
          title: "nextcloud.zip",
          children: [
            {
              title: i18n.t("migration.recipe-1"),
              icon: icons.folderOutline,
              children: [
                { title: "recipe.json", icon: icons.codeJson },
                { title: "full.jpg", icon: icons.fileImage },
                { title: "thumb.jpg", icon: icons.fileImage },
              ],
            },
            {
              title: i18n.t("migration.recipe-2"),
              icon: icons.folderOutline,
              children: [
                { title: "recipe.json", icon: icons.codeJson },
                { title: "full.jpg", icon: icons.fileImage },
                { title: "thumb.jpg", icon: icons.fileImage },
              ],
            },
          ],
        },
      ],
    },
    [MIGRATIONS.copymethat]: {
      text: i18n.t("migration.copymethat.description-long"),
      acceptedFileType: ".zip",
      tree: [
        {
          icon: icons.zip,
          title: "Copy_Me_That_20230306.zip",
          children: [
            {
              title: "images",
              icon: icons.folderOutline,
              children: [
                { title: "recipe_1_an5zy.jpg", icon: icons.fileImage },
                { title: "recipe_2_82el8.jpg", icon: icons.fileImage },
                { title: "recipe_3_j75qg.jpg", icon: icons.fileImage },
              ],
            },
            { title: "recipes.html", icon: icons.codeJson },
          ],
        },
      ],
    },
    [MIGRATIONS.myrecipebox]: {
      text: i18n.t("migration.myrecipebox.description-long"),
      acceptedFileType: ".csv",
      tree: false,
    },
    [MIGRATIONS.nextcloud]: {
      text: i18n.t("migration.nextcloud.description-long"),
      acceptedFileType: ".zip",
      tree: [
        {
          icon: icons.zip,
          title: "nextcloud.zip",
          children: [
            {
              title: i18n.t("migration.recipe-1"),
              icon: icons.folderOutline,
              children: [
                { title: "recipe.json", icon: icons.codeJson },
                { title: "full.jpg", icon: icons.fileImage },
                { title: "thumb.jpg", icon: icons.fileImage },
              ],
            },
            {
              title: i18n.t("migration.recipe-2"),
              icon: icons.folderOutline,
              children: [
                { title: "recipe.json", icon: icons.codeJson },
                { title: "full.jpg", icon: icons.fileImage },
                { title: "thumb.jpg", icon: icons.fileImage },
              ],
            },
          ],
        },
      ],
    },
    [MIGRATIONS.paprika]: {
      text: i18n.t("migration.paprika.description-long"),
      acceptedFileType: ".zip",
      tree: false,
    },
    [MIGRATIONS.plantoeat]: {
      text: i18n.t("migration.plantoeat.description-long"),
      acceptedFileType: ".zip,.csv,.txt",
      tree: false,
    },
    [MIGRATIONS.recipekeeper]: {
      text: i18n.t("migration.recipekeeper.description-long"),
      acceptedFileType: ".zip",
      tree: [
        {
          icon: icons.zip,
          title: "recipekeeperhtml.zip",
          children: [
            { title: "recipes.html", icon: icons.codeJson },
            {
              title: "images", icon: icons.folderOutline,
              children: [
                { title: "image1.jpg", icon: icons.fileImage },
                { title: "image2.jpg", icon: icons.fileImage },
              ],
            },
          ],
        },
      ],
    },
    [MIGRATIONS.tandoor]: {
      text: i18n.t("migration.tandoor.description-long"),
      acceptedFileType: ".zip",
      tree: [
        {
          icon: icons.zip,
          title: "tandoor_default_export_full_2023-06-29.zip",
          children: [
            {
              title: "1.zip",
              icon: icons.zip,
              children: [
                { title: "image.jpeg", icon: icons.fileImage },
                { title: "recipe.json", icon: icons.codeJson },
              ],
            },
            {
              title: "2.zip",
              icon: icons.zip,
              children: [
                { title: "image.jpeg", icon: icons.fileImage },
                { title: "recipe.json", icon: icons.codeJson },
              ],
            },
            {
              title: "3.zip",
              icon: icons.zip,
              children: [
                { title: "image.jpeg", icon: icons.fileImage },
                { title: "recipe.json", icon: icons.codeJson },
              ],
            },
          ],
        },
      ],
    },
    [MIGRATIONS.cookn]: {
      text: i18n.t("migration.cookn.description-long"),
      acceptedFileType: ".zip",
      tree: [
        {
          icon: icons.zip,
          title: "cookn.zip",
          children: [
            { title: "temp_brand.dsv", icon: icons.codeJson },
            { title: "temp_chapter_desc.dsv", icon: icons.codeJson },
            { title: "temp_chapter.dsv", icon: icons.codeJson },
            { title: "temp_cookBook_desc.dsv", icon: icons.codeJson },
            { title: "temp_cookBook.dsv", icon: icons.codeJson },
            { title: "temp_food_brand.dsv", icon: icons.codeJson },
            { title: "temp_food_group.dsv", icon: icons.codeJson },
            { title: "temp_food.dsv", icon: icons.codeJson },
            { title: "temp_ingredient.dsv", icon: icons.codeJson },
            { title: "temp_media.dsv", icon: icons.codeJson },
            { title: "temp_nutrient.dsv", icon: icons.codeJson },
            { title: "temp_recipe_desc.dsv", icon: icons.codeJson },
            { title: "temp_recipe.dsv", icon: icons.codeJson },
            { title: "temp_unit_equivalent.dsv", icon: icons.codeJson },
            { title: "temp_unit.dsv", icon: icons.codeJson },
            { title: "images", icon: icons.fileImage },
          ],
        },
      ],
    },
  };

  function addIdToNode(counter: number, node: TreeNode): number {
    node.id = counter;
    counter += 1;
    if (node.children) {
      node.children.forEach((child: TreeNode) => {
        counter = addIdToNode(counter, child);
      });
    }
    return counter;
  }

  for (const key in _content) {
    const migration = _content[key];
    if (migration.tree && Array.isArray(migration.tree)) {
      let counter = 1;
      migration.tree.forEach((node: TreeNode) => {
        counter = addIdToNode(counter, node);
      });
    }
  }

  console.log(_content);

  function setFileObject(fileObject: File) {
    state.fileObject = fileObject;
  }

  async function startMigration() {
    state.loading = true;
    const payload = {
      addMigrationTag: state.addMigrationTag,
      migrationType: state.migrationType,
      archive: state.fileObject,
    };

    const { data } = await api.groupMigration.startMigration(payload);

    state.loading = false;

    if (data) {
      state.reports.unshift(data);
    }
  }

  async function getMigrationReports() {
    const { data } = await api.groupReports.getAll("migration");

    if (data) {
      state.reports = data;
    }
  }

  async function deleteReport(id: string) {
    await api.groupReports.deleteOne(id);
    getMigrationReports();
  }

  /* WF4-REVIEW [J] */ onMounted(() => {
    getMigrationReports();
  });

  const content = computed(() => {
    const data = _content[state.migrationType];

    if (data) {
      return data;
    }
    else {
      return {
        text: "",
        acceptedFileType: ".zip",
        tree: false,
      };
    }
  });

  return (
    <>
  <Container>
    <BasePageTitle divider>
      <template>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="200" max-width="200" className="mb-2" src="/svgs/manage-data-migrations.svg" />
      </template>
      <template>
        {t('migration.recipe-data-migrations')}
      </template>
      {t('migration.recipe-data-migrations-explanation')}
    </BasePageTitle>
    <Container className={$vuetify.display.smAndDown ? 'px-0': ''}>
      <BaseCardSectionTitle title={t('migration.new-migration')} />
      <Card variant="outlined" loading={state.loading} style="border-color: lightgrey;">
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader>
          {t('migration.choose-migration-type')}
        </CardHeader>
        {(content) ? (
          <CardContent className="pb-0">
            <div className="mb-2">
              {/* WF4-REVIEW: v-model on complex expression "state.migrationType" [J] */}
              <BaseOverflowButton {/* WF4-REVIEW: v-model state.migrationType */} mode="model" items={items} />
            </div>
            {content.text}
            {(content.tree && Array.isArray(content.tree)) ? (
              /* WF4-REVIEW: unmapped <v-treeview> — judgement component, convert manually [J] */
              <VTreeview key={state.migrationType} density="compact" items={content.tree}>
                <template>
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={item.icon} />
                </template>
              </VTreeview>
            ) : null}
          </CardContent>
        ) : null}
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="mt-0">
          {t('general.upload-file')}
        </CardHeader>
        <CardContent>
          <AppButtonUpload accept={content.acceptedFileType || '.zip'} className="mb-2" post={false} file-name="file" text-btn={false} onUploaded={setFileObject} />
          {state.fileObject.name || t('migration.no-file-selected')}
        </CardContent>
        <CardContent>
          {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "state.addMigrationTag" [J] */}
          <FormControlLabel {/* WF4-REVIEW: v-model state.addMigrationTag */}>
            <template>
              <i18n-t keypath="migration.tag-all-recipes">
                <template>
                  <b className="mx-1">
                    {state.migrationType}
                  </b>
                </template>
              </i18n-t>
            </template>
          </FormControlLabel>
        </CardContent>
        <CardActions className="justify-end">
          <BaseButton disabled={!state.fileObject.name} submit onClick={startMigration}>
            {t("general.submit")}
          </BaseButton>
        </CardActions>
      </Card>
    </Container>
    <Container className="$vuetify.display.smAndDown ? 'px-0': ''">
      <BaseCardSectionTitle title={t('migration.previous-migrations')} />
      <ReportTable items={state.reports} onDelete={deleteReport} />
    </Container>
  </Container>
    </>
  );
}
