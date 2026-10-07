import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardContent, CardHeader, Container, FormControlLabel, TextField, form } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import type { ShoppingListOut } from "@/lib/api/types/household";
import { useUserApi } from "@/composables/api";
import { useAsyncKey } from "@/composables/use-utils";
import { useShoppingListPreferences } from "@/composables/use-users/preferences";
import type { UserOut } from "@/lib/api/types/user";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  middleware: ["auth"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function ShoppingListsPage() {
  const { t } = useTranslation();

  const auth = useMealieAuth();
  const i18n = useI18n();
  const [ready, setReady] = useState(false);
  const userApi = useUserApi();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  useSeoMeta({
    title: i18n.t("shopping-list.shopping-list"),
  });

  const [overrideDisableRedirect, setOverrideDisableRedirect] = useState(false);
  const disableRedirect = useMemo(() => route.query.disableRedirect === "true" || overrideDisableRedirect, []); // WF4-REVIEW: dependency array
  const preferences = useShoppingListPreferences();

  const state = /* WF4-REVIEW [J] */ reactive({
    createName: "",
    createDialog: false,
    deleteDialog: false,
    deleteTarget: "",
    ownerDialog: false,
    ownerTarget: ref<ShoppingListOut | null>(null),
  });
  const isCreateNameValid = useMemo(() => state.createName.trim(, []); // WF4-REVIEW: dependency array.length > 0);

  const { data: shoppingLists } = useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        return await fetchShoppingLists();
        if (cancelled) return;
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  const shoppingListChoices = useMemo(() =>  {
    if (!shoppingLists, []); // WF4-REVIEW: dependency array {
      return [];
    }

    return shoppingLists.filter(list => preferences.viewAllLists || list.userId === auth.user?.id);
  });

  // This has to appear before the shoppingListChoices watcher, otherwise that runs first and the redirect is not disabled
  /* WF4-REVIEW [J] */ watch(
    () => preferences.viewAllLists,
    () => {
      setOverrideDisableRedirect(true);
    },
  );

  /* WF4-REVIEW [J] */ watch(
    () => shoppingListChoices,
    () => {
      if (!disableRedirect && shoppingListChoices.length === 1) {
        navigateTo(`/shopping-lists/${shoppingListChoices.value[0].id}`);
      }
      else {
        setReady(true);
      }
    },
    {
      deep: true,
    },
  );

  async function fetchShoppingLists() {
    const { data } = await userApi.shopping.lists.getAll(1, -1, { orderBy: "name", orderDirection: "asc" });

    if (!data) {
      return [];
    }

    return data.items;
  }

  async function refresh() {
    shoppingLists = await fetchShoppingLists();
  }

  async function createOne() {
    if (!isCreateNameValid) return;
    const { data } = await userApi.shopping.lists.createOne({ name: state.createName.trim() });

    if (data) {
      refresh();
      state.createName = "";
    }
  }

  async function toggleOwnerDialog(list: ShoppingListOut) {
    if (!state.ownerDialog) {
      state.ownerTarget = list;
      await fetchAllUsers();
    }
    state.ownerDialog = !state.ownerDialog;
  }

  // ===============================================================
  // Shopping List Edit User/Owner

  const [allUsers, setAllUsers] = useState([]);
  const [updateUserId, setUpdateUserId] = useState(undefined);
  async function fetchAllUsers() {
    const { data } = await userApi.households.fetchMembers();
    if (!data) {
      return;
    }

    // update current user
    setAllUsers(data.items.sort((a, b) => ((a.fullName || "") < (b.fullName || "") ? -1 : 1)));
    setUpdateUserId(state.ownerTarget?.userId);
  }

  async function updateOwner() {
    if (!state.ownerTarget || !updateUserId) {
      return;
    }
    // user has not changed, so we should not update
    if (state.ownerTarget.userId === updateUserId) {
      return;
    }
    // get full list, so the move does not delete shopping list items
    const { data: fullList } = await userApi.shopping.lists.getOne(state.ownerTarget.id);
    if (!fullList) {
      return;
    }
    const { data } = await userApi.shopping.lists.updateOne(
      state.ownerTarget.id,
      { ...fullList, userId: updateUserId },
    );

    if (data) {
      refresh();
    }
  }

  function openDelete(id: string) {
    state.deleteDialog = true;
    state.deleteTarget = id;
  }

  async function deleteOne() {
    const { data } = await userApi.shopping.lists.deleteOne(state.deleteTarget);
    if (data) {
      refresh();
    }
  }

  return (
    <>
  {(shoppingListChoices && ready) ? (
    <Container className="narrow-container">
      {/* WF4-REVIEW: v-model on complex expression "state.createDialog" [J] */}
      <BaseDialog {/* WF4-REVIEW: v-model state.createDialog */} bottom-sheet title={t('shopping-list.create-shopping-list')} icon={$globals.icons.formatListCheck} can-submit submit-disabled={!isCreateNameValid} onSubmit={createOne}>
        <CardContent>
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.createName" [J] */}
          <TextField {/* WF4-REVIEW: v-model state.createName */} autofocus label={t('shopping-list.new-list')} />
        </CardContent>
      </BaseDialog>
      {/* WF4-REVIEW: v-model on complex expression "state.ownerDialog" [J] */}
      <BaseDialog {/* WF4-REVIEW: v-model state.ownerDialog */} bottom-sheet icon={$globals.icons.admin} title={t('user.edit-user')} can-confirm onConfirm={updateOwner}>
        <Container>
          {/* WF4-REVIEW: validation semantics [J] */}
          <form>
            {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
            <TextField select value={updateUserId} onChange={setUpdateUserId} items={allUsers} item-title="fullName" item-value="id" label={t('general.owner')} prepend-icon={$globals.icons.user} />
          </form>
        </Container>
      </BaseDialog>
      {/* WF4-REVIEW: v-model on complex expression "state.deleteDialog" [J] */}
      <BaseDialog {/* WF4-REVIEW: v-model state.deleteDialog */} bottom-sheet title={t('general.confirm')} icon={$globals.icons.alertCircle} color="error" can-confirm onConfirm={deleteOne}>
        <CardContent>
          {t('shopping-list.are-you-sure-you-want-to-delete-this-item')}
        </CardContent>
      </BaseDialog>
      <BasePageTitle divider>
        <template>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="100" max-width="100" src="/svgs/shopping-cart.svg" />
        </template>
        <template>
          {t('shopping-list.shopping-lists')}
        </template>
      </BasePageTitle>
      <Container className="d-flex align-center justify-end px-0 pt-0 pb-4">
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "preferences.viewAllLists" [J] */}
        <FormControlLabel {/* WF4-REVIEW: v-model preferences.viewAllLists */} hide-details label={t('general.show-all')} className="my-0 mr-4" />
        <BaseButton create className="my-0" onClick={state.createDialog = true} />
      </Container>
      {(!shoppingListChoices.length) ? (
        <Container>
          <BasePageTitle>
            <template>
              {t('shopping-list.no-shopping-lists-found')}
            </template>
          </BasePageTitle>
        </Container>
      ) : null}
      <section>
        {shoppingListChoices.map(list => (
          <Card key={list.id} className="my-2 left-border" to={`/shopping-lists/${list.id}`}>
            {/* WF4-REVIEW: title text moves to the title prop */}
            <CardHeader className="d-flex align-center">
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={$globals.icons.cartCheck} className="mr-2" />
              <span className="flex-grow-1">
                {list.name}
              </span>
              <Button icon variant="plain" onClick={(e) => { e.preventDefault(); toggleOwnerDialog(list); }}>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={$globals.icons.user} />
              </Button>
              <Button icon variant="plain" onClick={(e) => { e.preventDefault(); openDelete(list.id); }}>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={$globals.icons.delete} />
              </Button>
            </CardHeader>
          </Card>
        ))}
      </section>
    </Container>
  ) : null}
    </>
  );
}
