import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, TextField } from "@mui/material";
import { usePageState, usePageUser } from "@/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe } from "@/lib/api/types/recipe";
import { useUserApi } from "@/composables/api";
import { alertUnreportedError } from "@/composables/use-toast";
import RecipeImageUploadBtn from "@/components/Domain/Recipe/RecipeImageUploadBtn";
import RecipeSettingsMenu from "@/components/Domain/Recipe/RecipeSettingsMenu";
import { useUserStore } from "@/composables/store/use-user-store";
import UserAvatar from "@/components/Domain/User/UserAvatar";
import { useHouseholdStore } from "@/composables/store";

export default function RecipePageEditorToolbar() {
  const { t } = useTranslation();

  const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });

  const { user } = usePageUser();
  const api = useUserApi();
  const { i18n } = useTranslation();
  const { imageKey } = usePageState(recipe.slug);

  const canEditOwner = useMemo(() => {
    return user.id === recipe.userId || user.admin;
  }, []); // WF4-REVIEW: dependency array

  const { store: allUsers } = useUserStore();
  const { store: households } = useHouseholdStore();

  function itemsProps(item: any) {
    const owner = allUsers.find(u => u.id === item.id);
    return {
      value: item.id,
      title: item.fullName,
      subtitle: owner ? households.find(h => h.id === owner.householdId)?.name || "" : "",
    };
  }

  async function uploadImage(fileObject: File) {
    if (!recipe || !recipe.slug) {
      return;
    }
    const { data, error } = await api.recipes.updateImage(recipe.slug, fileObject);
    if (error) {
      alertUnreportedError(error, i18n.t("events.something-went-wrong"));
      return;
    }

    if (data?.image) {
      recipe.image = data.image;
    }
    imageKey.value++;
  }

  function refreshImage(image: string) {
    if (image) {
      recipe.image = image;
    }
    imageKey.value++;
  }

  async function deleteImage() {
    // The image is already deleted on the backend, just need to update the UI
    recipe.image = "";
    imageKey.value++;
  }

  return (
    <>
  <div className="d-flex justify-start align-top flex-wrap">
    <RecipeImageUploadBtn className="my-2" slug={recipe.slug} onUpload={uploadImage} onRefresh={refreshImage} onDelete={deleteImage} />
    {/* WF4-REVIEW: v-model on complex expression "recipe.settings" [J] */}
    <RecipeSettingsMenu className="my-2 mx-1" is-owner={recipe.userId == user.id} onUpload={uploadImage} />
    <Box sx={{ flexGrow: 1 }} />
    {/* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "recipe.userId" [J] */}
    <TextField select className="my-2" max-width="300" items={allUsers} item-props={itemsProps} label={t('general.owner')} disabled={!canEditOwner} variant="outlined" density="compact">
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <UserAvatar user-id={recipe.userId} tooltip={false} />
      </>
    </TextField>
  </div>
    </>
  );
}
