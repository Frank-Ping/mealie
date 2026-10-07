import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardContent, Container, Divider, Grid, ListItemSecondaryAction, TextField } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { VueDraggable } from "vue-draggable-plus";
import RecipeList from "@/components/Domain/Recipe/RecipeList";
import MultiPurposeLabelSection from "@/components/Domain/ShoppingList/MultiPurposeLabelSection";
import ShoppingListAddItemForm from "@/components/Domain/ShoppingList/ShoppingListAddItemForm";
import ShoppingListItem from "@/components/Domain/ShoppingList/ShoppingListItem";
import ShoppingListItemEditor from "@/components/Domain/ShoppingList/ShoppingListItemEditor";
import { useShoppingListPage } from "@/composables/shopping-list-page/use-shopping-list-page";
import { useLabelStore, useUnitStore, useFoodStore } from "@/composables/store";
import { alert } from "@/composables/use-toast";
import type { ShoppingListItemOut } from "@/lib/api/types/household";

export const handle = {
  middleware: ["auth"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Id() {
  const { t } = useTranslation();

  const { smAndUp } = useDisplay();
  const i18n = useI18n();

  useSeoMeta({
    title: i18n.t("shopping-list.shopping-list"),
  });

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const id = route.params.id as string;

  const [editingItem, setEditingItem] = useState(undefined);
  const shoppingListPage = useShoppingListPage(id);
  const { store: allLabels } = useLabelStore();
  const { store: allUnits } = useUnitStore();
  const { store: allFoods } = useFoodStore();

  function itemCheckedToast(item: ShoppingListItemOut) {
    setTimeout(() => {
      alert.info(
        i18n.t("shopping-list.item-checked-off", { item: item.food?.name || item.note || i18n.t("recipe.ingredient") }),
        undefined,
        {
          timeout: 4000,
          action: {
            message: i18n.t("general.undo"),
            onClick: () => {
              item.checked = false;
              shoppingListPage.saveListItem(item);
            },
          },
        },
      );
    }, 500);
  }

  const {
    shoppingList,
    state,
    checkAll,
    uncheckAll,
    deleteChecked,
    reorderLabelsDialog,
    localLabels,
    saveLabelOrder,
    cancelLabelOrder,
    updateLabelOrder,
    edit,
    threeDot,
    openCheckAll,
    copyListItems,
    toggleReorderLabelsDialog,
    isOffline,
    createEditorOpen,
    createListItemData,
    createListItem,
    itemsByLabel,
    getLabelColor,
    loadingCounter,
    updateIndexUncheckedByLabel,
    recipeMap,
    saveListItem,
    deleteListItem,
    listItems,
    openUncheckAll,
    openDeleteChecked,
    recipeList,
    removeRecipeReferenceToList,
    addRecipeReferenceToList,
    search,
    isSearching,
    isSearchOpen,
    canSearch,
    toggleSearch,
    matchesSearch,
    hasMatches,
    clearSearch,
    visibleCheckedCount,
    hasSearchResults,
  } = shoppingListPage;

  // Expand the checked section while searching, so an item that has already been
  // checked off can be found and unchecked without expanding the section by hand.
  const [checkedPanel, setCheckedPanel] = useState(undefined);
  /* WF4-REVIEW [J] */ watch(isSearching, (searching) => {
    setCheckedPanel(searching ? 0 : undefined);
  });

  return (
    <>
  {(shoppingList) ? (
    <Container className="md-container">
      {/* WF4-REVIEW: v-model on complex expression "state.checkAllDialog" [J] */}
      <BaseDialog {/* WF4-REVIEW: v-model state.checkAllDialog */} bottom-sheet title={t('general.confirm')} icon={$globals.icons.checkboxMultipleMarkedOutline} can-confirm onConfirm={checkAll}>
        <CardContent>
          {t('shopping-list.are-you-sure-you-want-to-check-all-items')}
        </CardContent>
      </BaseDialog>
      {/* WF4-REVIEW: v-model on complex expression "state.uncheckAllDialog" [J] */}
      <BaseDialog {/* WF4-REVIEW: v-model state.uncheckAllDialog */} bottom-sheet title={t('general.confirm')} icon={$globals.icons.checkboxMultipleBlankOutline} can-confirm onConfirm={uncheckAll}>
        <CardContent>
          {t('shopping-list.are-you-sure-you-want-to-uncheck-all-items')}
        </CardContent>
      </BaseDialog>
      {/* WF4-REVIEW: v-model on complex expression "state.deleteCheckedDialog" [J] */}
      <BaseDialog {/* WF4-REVIEW: v-model state.deleteCheckedDialog */} bottom-sheet title={t('general.confirm')} icon={$globals.icons.alertCircle} can-confirm onConfirm={deleteChecked}>
        <CardContent>
          {t('shopping-list.are-you-sure-you-want-to-delete-checked-items')}
        </CardContent>
      </BaseDialog>
      <BaseDialog value={reorderLabelsDialog} onChange={/* WF4-REVIEW: setter */ setReorderLabelsDialog} icon={$globals.icons.tagArrowUp} title={t('shopping-list.reorder-labels')} submit-icon={$globals.icons.save} submit-text={t('general.save')} can-submit onSubmit={saveLabelOrder} onClose={cancelLabelOrder}>
        <Card height="fit-content" max-height="70vh" style="overflow-y: auto;">
          {(localLabels) ? (
            <VueDraggable value={localLabels} onChange={/* WF4-REVIEW: setter */ setLocalLabels} handle=".handle" delay={250} delay-on-touch-only={true} className="my-2" onUpdateModelValue={updateLabelOrder}>
              {localLabels.map((labelSetting, index) => (
                <div key={labelSetting.id}>
                  {/* WF4-REVIEW: v-model on complex expression "localLabels[index]" [J] */}
                  <MultiPurposeLabelSection {/* WF4-REVIEW: v-model localLabels[index] */} use-color />
                </div>
              ))}
            </VueDraggable>
          ) : null}
        </Card>
      </BaseDialog>
      <BasePageTitle divider className="shopping-list-title">
        <template>
          <Container className="px-0">
            <Grid container no-gutters>
              <ButtonLink to={`/shopping-lists?disableRedirect=true`} text={t('shopping-list.all-lists')} icon={$globals.icons.backArrow} />
              <Box sx={ flexGrow: 1 } />
              {(smAndUp) ? (
                <h2 className="text-h5">
                  {shoppingList.name}
                </h2>
              ) : null}
              <Box sx={ flexGrow: 1 } />
              <BaseButtonGroup className="d-flex" buttons={[
                ...(canSearch || isSearchOpen ? [{
                  icon: $globals.icons.search,
                  text: t('search.search'),
                  event: 'search',
                  color: isSearchOpen ? 'primary' : undefined,
                }] : []),
                {
                  icon: $globals.icons.contentCopy,
                  text: '',
                  event: 'edit',
                  children: [
                    {
                      icon: $globals.icons.contentCopy,
                      text: t('shopping-list.copy-as-text'),
                      event: 'copy-plain',
                    },
                    {
                      icon: $globals.icons.contentCopy,
                      text: t('shopping-list.copy-as-markdown'),
                      event: 'copy-markdown',
                    },
                  ],
                },
                {
                  icon: $globals.icons.checkboxMultipleMarkedOutline,
                  text: t('shopping-list.check-all-items'),
                  event: 'check',
                  disabled: isSearching,
                },
                {
                  icon: $globals.icons.dotsVertical,
                  text: '',
                  event: 'three-dot',
                  children: [
                    {
                      icon: $globals.icons.tags,
                      text: t('shopping-list.reorder-labels'),
                      event: 'reorder-labels',
                    },
                    {
                      icon: $globals.icons.tags,
                      text: t('shopping-list.manage-labels'),
                      event: 'manage-labels',
                    },
                  ],
                },
              ]} onSearch={toggleSearch} onEdit={edit = true} onThreeDot={threeDot = true} onCheck={openCheckAll} onCopyPlain={copyListItems('plain')} onCopyMarkdown={copyListItems('markdown')} onReorderLabels={toggleReorderLabelsDialog()} onManageLabels={$router.push(`/group/data/labels`)} />
            </Grid>
          </Container>
        </template>
        <template>
          {smAndUp ? "" : shoppingList.name}
        </template>
      </BasePageTitle>
      {(isOffline) ? (
        <BannerWarning title={t('shopping-list.you-are-offline')} description={t('shopping-list.you-are-offline-description')} />
      ) : null}
      {(!edit) ? (
        <section className="py-2 d-flex flex-column ga-1 shopping-list-view">
          {(isSearchOpen) ? (
            /* WF4-REVIEW: rules/error-messages → error+helperText */
            <TextField model-value={search} label={t('search.search')} prepend-inner-icon={$globals.icons.search} autofocus clearable hide-details density="compact" variant="solo" flat single-line onUpdateModelValue={value => search = value ?? ''} onClickClear={clearSearch} />
          ) : null}
          {($vuetify.display.smAndDown) ? (
            <ShoppingListAddItemForm value={createListItemData} onChange={/* WF4-REVIEW: setter */ setCreateListItemData} className="my-4" labels={allLabels || []} units={allUnits || []} foods={allFoods || []} onCancel={createEditorOpen = false} onSave={createListItem} />
          ) : (
            <div className="mb-3">
              {(createEditorOpen) ? (
                <ShoppingListItemEditor value={createListItemData} onChange={/* WF4-REVIEW: setter */ setCreateListItemData} className="my-4" labels={allLabels || []} units={allUnits || []} foods={allFoods || []} allow-delete={false} onDelete={createEditorOpen = false} onCancel={createEditorOpen = false} onSave={createListItem} />
              ) : (
                <InputLabelType items={allFoods} label={t('shopping-list.add-item')} icon={$globals.icons.foods} search onFocus={createEditorOpen = true} />
              )}
            </div>
          )}
          <TransitionGroup name="scroll-x-transition">
            {itemsByLabel.map((value, key) => (
              <template key={key}>
                {(hasMatches(value)) ? (
                  <BaseExpansionPanels v-model={0} start-open>
                    <Accordion className="shopping-list-section">
                      <AccordionSummary color={getLabelColor(key)} className="body-1 section-title" className={getLabelColor(key) ? '' : 'text-medium-emphasis'}>
                        {key}
                      </AccordionSummary>
                      <AccordionDetails eager>
                        <VueDraggable model-value={value} handle=".handle" delay={250} delay-on-touch-only={true} disabled={isSearching} onStart={loadingCounter += 1} onEnd={loadingCounter -= 1} onUpdateModelValue={updateIndexUncheckedByLabel(key.toString(), $event)}>
                          <TransitionGroup name="scroll-x-transition">
                            {value.map((item, index) => (
                              <template key={item.id}>
                                {(matchesSearch(item)) ? (
                                  /* WF4-REVIEW: v-model on complex expression "value[index]" [J] */
                                  <ShoppingListItem {/* WF4-REVIEW: v-model value[index] */} className="my-2 w-auto shopping-list-item-row" edit={editingItem === item.id} labels={allLabels || []} units={allUnits || []} foods={allFoods || []} recipes={recipeMap} onChecked={(item) => {
                          saveListItem(item);
                          itemCheckedToast(item);
                        }} onSave={(item) => {
                          editingItem = undefined;
                          saveListItem(item);
                        }} onDelete={deleteListItem(item)} onView={editingItem = undefined} onEdit={editingItem = item.id} />
                                ) : null}
                              </template>
                            ))}
                          </TransitionGroup>
                        </VueDraggable>
                      </AccordionDetails>
                    </Accordion>
                  </BaseExpansionPanels>
                ) : null}
              </template>
            ))}
          </TransitionGroup>
          {/* WF4-REVIEW: wrapper — accordion group semantics */}
          <Box value={checkedPanel} onChange={setCheckedPanel} flat rounded>
            {(listItems.checked && hasMatches(listItems.checked)) ? (
              <Accordion>
                <AccordionSummary className="border-solid border-thin py-1">
                  <div className="d-flex align-center flex-0-1-100">
                    <div className="flex-1-0">
                      {t('shopping-list.items-checked-count', visibleCheckedCount)}
                    </div>
                    <div className="justify-end">
                      <BaseButtonGroup buttons={[
                    {
                      icon: $globals.icons.checkboxMultipleBlankOutline,
                      text: t('shopping-list.uncheck-all-items'),
                      event: 'uncheck',
                      disabled: isSearching,
                    },
                    {
                      icon: $globals.icons.delete,
                      text: t('shopping-list.delete-checked'),
                      event: 'delete',
                      disabled: isSearching,
                    },
                  ]} onUncheck={openUncheckAll} onDelete={openDeleteChecked} />
                    </div>
                  </div>
                </AccordionSummary>
                <AccordionDetails eager>
                  <TransitionGroup name="scroll-x-transition">
                    {listItems.checked.map((item, idx) => (
                      <div sx={{ display: (matchesSearch(item)) ? undefined : "none" }} key={item.id}>
                        {/* WF4-REVIEW: v-model on complex expression "listItems.checked[idx]" [J] */}
                        <ShoppingListItem {/* WF4-REVIEW: v-model listItems.checked[idx] */} className="strike-through-note shopping-list-item-row" labels={allLabels || []} units={allUnits || []} foods={allFoods || []} onChecked={saveListItem} onSave={saveListItem} onDelete={deleteListItem(item)} />
                      </div>
                    ))}
                  </TransitionGroup>
                </AccordionDetails>
              </Accordion>
            ) : null}
          </Box>
          {(!hasSearchResults) ? (
            <Alert type="info" variant="tonal" density="compact">
              {t('search.no-results')}
            </Alert>
          ) : null}
        </section>
      ) : null}
      {(shoppingList.recipeReferences && shoppingList.recipeReferences.length > 0) ? (
        /* WF4-REVIEW: unmapped <v-lazy> — judgement component, convert manually [J] */
        <VLazy className="mt-6">
          <section>
            <div>
              <span>
                {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                <MdiIcon name={$globals.icons.silverwareForkKnife} className="mb-1" />
              </span>
              {t('shopping-list.linked-recipes-count', shoppingList.recipeReferences
            ? shoppingList.recipeReferences.length
            : 0)}
            </div>
            <Divider />
            <RecipeList recipes={recipeList} show-description disabled={isOffline}>
              {recipeList.map((recipe, index) => (
                <template key={'item-actions-decrease' + recipe.id}>
                  <ListItemSecondaryAction>
                    {(recipe) ? (
                      <Button icon flat className="bg-transparent" disabled={isOffline} onClick={(e) => { e.preventDefault(); removeRecipeReferenceToList(recipe.id!); }}>
                        {/* WF4-REVIEW: icon name resolves via lib/icons */}
                        <MdiIcon name={$globals.icons.minus} color="grey-lighten-1" />
                      </Button>
                    ) : null}
                  </ListItemSecondaryAction>
                  <div className="pl-3">
                    {shoppingList.recipeReferences[index].recipeQuantity}
                  </div>
                  <ListItemSecondaryAction>
                    <Button icon disabled={isOffline} flat className="bg-transparent" onClick={(e) => { e.preventDefault(); addRecipeReferenceToList(recipe.id!); }}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={$globals.icons.createAlt} color="grey-lighten-1" />
                    </Button>
                  </ListItemSecondaryAction>
                </template>
              ))}
            </RecipeList>
          </section>
        </VLazy>
      ) : null}
      <WakelockSwitch />
    </Container>
  ) : null}
    </>
  );
}
