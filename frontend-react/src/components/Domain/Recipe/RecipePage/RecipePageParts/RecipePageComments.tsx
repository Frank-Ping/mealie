import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardContent, CardHeader, Divider, TextField } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useUserApi } from "@/composables/api";
import type { Recipe } from "@/lib/api/types/recipe";
import UserAvatar from "@/components/Domain/User/UserAvatar";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import { usePageUser } from "@/composables/recipe-page/shared-state";
import SafeMarkdown from "@/components/global/SafeMarkdown";

export default function RecipePageComments() {
  const { t } = useTranslation();

  const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
  const api = useUserApi();
  const { user } = usePageUser();
  const [comment, setComment] = useState("");

  async function submitComment() {
    const text = comment.trim();
    if (!text) {
      return;
    }
    const { data } = await api.recipes.comments.createOne({
      recipeId: recipe.id,
      text,
    });

    if (data) {
      recipe.comments.push(data);
    }

    setComment("");
  }

  async function deleteComment(id: string) {
    const { response } = await api.recipes.comments.deleteOne(id);

    if (response?.status === 200) {
      recipe.comments = recipe.comments.filter(comment => comment.id !== id);
    }
  }

  return (
    <>
  <div>
    {/* WF4-REVIEW: title text moves to the title prop */}
    <CardHeader className="headline pb-3">
      {/* WF4-REVIEW: icon name resolves via lib/icons */}
      <MdiIcon name={$globals.icons.commentTextMultipleOutline} className="mr-2" />
      {t("recipe.comments")}
    </CardHeader>
    <Divider className="mx-2" />
    {(user.id) ? (
      <div className="d-flex flex-column">
        <div className="d-flex mt-3" style="gap: 10px">
          <UserAvatar tooltip={false} size="40" user-id={user.id} />
          <TextField multiline value={comment} onChange={setComment} hide-details density="compact" single-line variant="outlined" auto-grow rows="2" placeholder={t('recipe.join-the-conversation')} />
        </div>
        <div className="ml-auto mt-1">
          <BaseButton size="small" disabled={!comment.trim()} onClick={submitComment}>
            <template>
              {$globals.icons.check}
            </template>
            {t("general.submit")}
          </BaseButton>
        </div>
      </div>
    ) : null}
    {recipe.comments.map(recipeComment => (
      <div key={recipeComment.id} className="d-flex my-2" style="gap: 10px">
        <UserAvatar tooltip={false} size="40" user-id={recipeComment.userId} />
        <Card variant="outlined" className="flex-grow-1">
          <CardContent className="pa-3 pb-0">
            <p className="">
              {recipeComment.user.fullName}
              •
              {$d(Date.parse(recipeComment.createdAt), "medium")}
            </p>
            <SafeMarkdown source={recipeComment.text} />
          </CardContent>
          <CardActions className="justify-end mt-0 pt-0">
            {(user.id == recipeComment.user.id || user.admin) ? (
              <Button color="error" variant="text" size="x-small" onClick={deleteComment(recipeComment.id)}>
                {t("general.delete")}
              </Button>
            ) : null}
          </CardActions>
        </Card>
      </div>
    ))}
  </div>
    </>
  );
}
