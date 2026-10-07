import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardContent, CardHeader, Checkbox, Collapse, Divider, Drawer, Fade, Grid, LinearProgress, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { VueDraggable } from "vue-draggable-plus";
import type { RecipeStep, RecipeNote, RecipeIngredient, RecipeAsset, Recipe } from "@/lib/api/types/recipe";
import { uuid4 } from "@/composables/use-utils";
import { useUserApi, useStaticRoutes } from "@/composables/api";
import { usePageState } from "@/composables/recipe-page/shared-state";
import { useExtractIngredientReferences } from "@/composables/recipe-page/use-extract-ingredient-references";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import DropZone from "@/components/global/DropZone";
import { alert } from "@/composables/use-toast";
import RecipeIngredients from "@/components/Domain/Recipe/RecipeIngredients";
import RecipeIngredientHtml from "@/components/Domain/Recipe/RecipeIngredientHtml";

interface Props {
  recipe: Record<string, unknown>;
  scale?: number;
  ingredientStorageKey?: string;
  onClickInstructionField?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onUpdate:assets?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
}

interface MergerHistory {
  target: number;
  source: number;
  targetText: string;
  sourceText: string;
}

export default function RecipePageInstructions({ recipe, scale = 1, ingredientStorageKey = undefined, onClickInstructionField, onUpdate:assets }: Props) {
  const { t } = useTranslation();

  const instructionList = defineModel<RecipeStep[]>("modelValue", { required: true, default: () => [] });
  const assets = defineModel<RecipeAsset[]>("assets", { required: true, default: () => [] });

  const props = /* props via generated interface + destructured signature */

  const emit = /* emits → props: onClickInstructionField, onUpdate:assets */

  const { i18n } = useTranslation();
  const { isCookMode, toggleCookMode, isEditForm } = usePageState(recipe.slug);
  const { extractIngredientReferences } = useExtractIngredientReferences();

  const [dialog, setDialog] = useState(false);
  const [disabledSteps, setDisabledSteps] = useState([]);
  const [unusedIngredients, setUnusedIngredients] = useState([]);
  const [usedIngredients, setUsedIngredients] = useState([]);

  const [showTitleEditor, setShowTitleEditor] = useState({});

  // ===============================================================
  // UI State Helpers

  function hasSectionTitle(title: string | undefined) {
    return !(title === null || title === "" || title === undefined);
  }

  /* WF4-REVIEW [J] */ watch(instructionList, (v) => {
    setDisabledSteps([]);

    v.forEach((element: RecipeStep) => {
      if (element.id !== undefined) {
        showTitleEditor[element.id!] = hasSectionTitle(element.title!);
      }
    });
  }, { deep: true });

  const [showCookMode, setShowCookMode] = useState(false);

  /* WF4-REVIEW [J] */ onMounted(() => {
    instructionList.forEach((element: RecipeStep) => {
      if (element.id !== undefined) {
        showTitleEditor[element.id!] = hasSectionTitle(element.title!);
      }

      if (setShowCookMode(== false && element.ingredientReferences && element.ingredientReferences.length > 0) {
        showCookMode = true);
      }

      setShowTitleEditor({ ...showTitleEditor });
    });

    if (assets === undefined) {
      emit("update:assets", []);
    }
  });

  function toggleDisabled(stepIndex: number) {
    if (isEditForm) {
      return;
    }
    if (disabledSteps.includes(stepIndex)) {
      const index = disabledSteps.indexOf(stepIndex);
      if (index !== -1) {
        disabledSteps.splice(index, 1);
      }
    }
    else {
      disabledSteps.push(stepIndex);
    }
  }

  function isChecked(stepIndex: number) {
    if (disabledSteps.includes(stepIndex) && !isEditForm) {
      return "disabled-card";
    }
  }

  function sectionTitleLabel(id?: string) {
    return id && showTitleEditor[id]
      ? i18n.t("recipe.clear-section")
      : i18n.t("recipe.add-section");
  }

  function toggleShowTitle(id?: string) {
    if (!id) {
      return;
    }

    const showing = showTitleEditor[id];
    if (showing) {
      // visibility is re-derived from the title whenever the list changes, so hiding a section
      // only sticks if the title goes with it
      const step = instructionList.find(element => element.id === id);
      if (step) {
        step.title = "";
      }
    }

    showTitleEditor[id] = !showing;

    const temp = { ...showTitleEditor };
    setShowTitleEditor(temp);
  }

  function onDragEnd() {
    setDrag(false);
  }

  // ===============================================================
  // Reference Linker
  const [activeLinkerIndex, setActiveLinkerIndex] = useState(0);
  const [activeRefs, setActiveRefs] = useState([]);
  const [activeNoteReferenceIds, setActiveNoteReferenceIds] = useState([]);
  const [activeText, setActiveText] = useState("");
  const [linkedNotesSheetOpen, setLinkedNotesSheetOpen] = useState(false);
  const [activeStepLinkedNotes, setActiveStepLinkedNotes] = useState([]);

  const availableDialogNextStep = useMemo(() => activeLinkerIndex < instructionList.length - 1, []); // WF4-REVIEW: dependency array
  const activeDialogStepText = activeText; // was computed — plain read stays reactive
  const linkableNotes = useMemo(() => {
    return (recipe.notes ?? []).filter((note): note is RecipeNote & { referenceId: string } => note.referenceId != null);
  }, []); // WF4-REVIEW: dependency array

  function openReferenceDialog(idx: number) {
    setActiveLinkerIndex(idx);
    const step = instructionList.value[idx];

    if (!step) {
      setActiveRefs([]);
      setActiveNoteReferenceIds([]);
      return;
    }

    setActiveText(step.text);
    setUsedIngredients();
    setActiveRefs((step.ingredientReferences ?? []).map(ref => ref.referenceId ?? ""));
    setActiveNoteReferenceIds((step.noteReferences ?? [])
      .map(ref => ref.referenceId)
      .filter((ref): ref is string => ref != null));
    setDialog(true);
  }

  function updateCookModeVisibility() {
    setShowCookMode(false);
    instructionList.forEach((element) => {
      if (setShowCookMode(== false && element.ingredientReferences && element.ingredientReferences.length > 0) {
        showCookMode = true);
      }
    });
  }

  function saveDialogLinks() {
    const step = instructionList.value[activeLinkerIndex];

    if (!step) {
      setDialog(false);
      return;
    }

    step.ingredientReferences = activeRefs.map((referenceId) => {
      return { referenceId };
    });

    step.noteReferences = activeNoteReferenceIds.map((referenceId) => {
      return { referenceId };
    });

    updateCookModeVisibility();
    setDialog(false);
  }

  function saveAndOpenNextDialogLinks() {
    const currentStepIndex = activeLinkerIndex;

    if (!availableDialogNextStep) {
      return;
    }

    saveDialogLinks();
    /* WF4-REVIEW [J] */ nextTick(() => openReferenceDialog(currentStepIndex + 1));
  }

  function closeDialog() {
    setDialog(false);
  }

  function setUsedIngredients() {
    const usedRefs: { [key: string]: boolean } = {};

    instructionList.forEach((element, idx) => {
      if (idx === activeLinkerIndex) return;
      element.ingredientReferences?.forEach((ref) => {
        if (ref.referenceId) usedRefs[ref.referenceId] = true;
      });
    });

    setUsedIngredients(recipe.recipeIngredient.filter(ing => !!ing.referenceId && ing.referenceId in usedRefs));

    setUnusedIngredients(recipe.recipeIngredient.filter(ing => !!ing.referenceId && !(ing.referenceId in usedRefs)));
  }

  /* WF4-REVIEW [J] */ watch(activeRefs, () => setUsedIngredients());

  function autoSetReferences() {
    extractIngredientReferences(
      recipe.recipeIngredient,
      activeRefs,
      activeText,
    ).forEach(ingredient => activeRefs.push(ingredient));
  }

  const noteLookup = useMemo(() => {
    const results: { [key: string]: string } = {};
    return (recipe.notes ?? []).reduce((prev, note) => {
      if (note.referenceId != null) {
        prev[note.referenceId] = note.title;
      }
      return prev;
    }, results);
  }, []); // WF4-REVIEW: dependency array

  const notesByReferenceId = useMemo(() => {
    const results: { [key: string]: RecipeNote } = {};
    return (recipe.notes ?? []).reduce((prev, note) => {
      if (note.referenceId != null) {
        prev[note.referenceId] = note;
      }
      return prev;
    }, results);
  }, []); // WF4-REVIEW: dependency array

  function linkedNotesForStep(step: RecipeStep): RecipeNote[] {
    return (step.noteReferences ?? [])
      .map(ref => ref.referenceId ? notesByReferenceId.value[ref.referenceId] : undefined)
      .filter((note): note is RecipeNote => note !== undefined);
  }

  function openLinkedNotesSheet(step: RecipeStep) {
    setActiveStepLinkedNotes(linkedNotesForStep(step));
    setLinkedNotesSheetOpen(activeStepLinkedNotes.length > 0);
  }

  function hasLinkedIngredients(step: RecipeStep): boolean {
    return !!step.ingredientReferences && step.ingredientReferences.length > 0;
  }

  function hasLinkedNotes(step: RecipeStep): boolean {
    return linkedNotesForStep(step).length > 0;
  }

  function hasCookModeLinkedContent(step: RecipeStep): boolean {
    return hasLinkedIngredients(step) || hasLinkedNotes(step);
  }

  const ingredientLookup = useMemo(() => {
    const results: { [key: string]: RecipeIngredient } = {};
    return recipe.recipeIngredient.reduce((prev, ing) => {
      if (ing.referenceId === undefined) {
        return prev;
      }
      prev[ing.referenceId] = ing;
      return prev;
    }, results);
  }, []); // WF4-REVIEW: dependency array

  // Map each ingredient's referenceId to its section title
  const ingredientSectionTitles = useMemo(() => {
    const titleMap: { [key: string]: string } = {};
    let currentTitle = "";

    // Go through all ingredients in order
    recipe.recipeIngredient.forEach((ingredient) => {
      if (ingredient.referenceId === undefined) {
        return;
      }

      // If this ingredient has a title, update the current title
      if (ingredient.title) {
        currentTitle = ingredient.title;
      }

      // Assign the current title to this ingredient
      titleMap[ingredient.referenceId] = currentTitle;
    });

    return titleMap;
  }, []); // WF4-REVIEW: dependency array

  const groupedUnusedIngredients = useMemo(() => (): Record<string, RecipeIngredient[]> => {
    const groups: Record<string, RecipeIngredient[]> = {};

    // Group ingredients by section title
    unusedIngredients.forEach((ingredient) => {
      if (ingredient.referenceId === undefined) {
        return;
      }

      // Use the section title from the mapping, or fallback to the ingredient's own title
      const title = ingredientSectionTitles.value[ingredient.referenceId] || ingredient.title || "";
      (groups[title] ||= []).push(ingredient);
    });

    return groups;
  }, []); // WF4-REVIEW: dependency array

  const groupedUsedIngredients = useMemo(() => (): Record<string, RecipeIngredient[]> => {
    const groups: Record<string, RecipeIngredient[]> = {};
    usedIngredients.forEach((ingredient) => {
      if (ingredient.referenceId === undefined) {
        return;
      }

      // Use the section title from the mapping, or fallback to the ingredient's own title
      const title = ingredientSectionTitles.value[ingredient.referenceId] || ingredient.title || "";
      (groups[title] ||= []).push(ingredient);
    });

    return groups;
  }, []); // WF4-REVIEW: dependency array

  // ===============================================================
  // Instruction Merger
  const [mergeHistory, setMergeHistory] = useState([]);

  function mergeAbove(target: number, source: number) {
    if (target < 0) {
      return;
    }

    mergeHistory.push({
      target,
      source,
      targetText: instructionList.value[target].text,
      sourceText: instructionList.value[source].text,
    });

    instructionList.value[target].text += " " + instructionList.value[source].text;
    instructionList.splice(source, 1);
  }

  function undoMerge(event: KeyboardEvent) {
    if (event.ctrlKey && event.code === "KeyZ") {
      if (!(mergeHistory?.length > 0)) {
        return;
      }

      const lastMerge = mergeHistory.pop();
      if (!lastMerge) {
        return;
      }

      instructionList.value[lastMerge.target].text = lastMerge.targetText;
      instructionList.splice(lastMerge.source, 0, {
        id: uuid4(),
        title: "",
        text: lastMerge.sourceText,
        ingredientReferences: [],
        noteReferences: [],
      });
    }
  }

  function moveTo(dest: string, source: number) {
    if (dest === "top") {
      instructionList.unshift(instructionList.splice(source, 1)[0]);
    }
    else {
      instructionList.push(instructionList.splice(source, 1)[0]);
    }
  }

  function insert(dest: number) {
    instructionList.splice(dest, 0, { id: uuid4(), text: "", title: "", ingredientReferences: [], noteReferences: [] });
  }

  const [previewStates, setPreviewStates] = useState([]);

  function togglePreviewState(index: number) {
    const temp = [...previewStates];
    temp[index] = !temp[index];
    setPreviewStates(temp);
  }

  function toggleCollapseSection(index: number) {
    const sectionSteps: number[] = [];

    for (let i = index; i < instructionList.length; i++) {
      if (!(i === index) && hasSectionTitle(instructionList.value[i].title!)) {
        break;
      }
      else {
        sectionSteps.push(i);
      }
    }

    const allCollapsed = sectionSteps.every(idx => disabledSteps.includes(idx));

    if (allCollapsed) {
      setDisabledSteps(disabledSteps.filter(idx => !sectionSteps.includes(idx)));
    }
    else {
      setDisabledSteps([...disabledSteps, ...sectionSteps]);
    }
  }

  const [drag, setDrag] = useState(false);

  // ===============================================================
  // Image Uploader
  const api = useUserApi();
  const { recipeAssetPath } = useStaticRoutes();

  const [loadingStates, setLoadingStates] = useState({});

  async function handleImageDrop(index: number, files: File[]) {
    if (!files) {
      return;
    }

    // Check if the file is an image
    const file = files[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    loadingStates[index] = true;

    const { data } = await api.recipes.createAsset(recipe.slug, {
      name: file.name,
      icon: "mdi-file-image",
      file,
      extension: file.name.split(".").pop() || "",
    });

    loadingStates[index] = false;

    if (!data) {
      return; // TODO: Handle error
    }

    embedAsset(index, data);
  }

  /**
   * Images dragged out of another browser tab carry a URL instead of a file, so the server
   * fetches the image on our behalf.
   */
  async function handleImageUrlDrop(index: number, url: string) {
    loadingStates[index] = true;

    const { data } = await api.recipes.createAssetFromUrl(recipe.slug, url);

    loadingStates[index] = false;

    if (!data) {
      alert.error(i18n.t("recipe.failed-to-attach-image"));
      return;
    }

    embedAsset(index, data);
  }

  /**
   * Some pages render images from blob: urls, which resolve only inside the origin that made
   * them. Nothing can read those bytes from here, so point the user at what does work.
   */
  function notifyUnsupportedDrop() {
    alert.error(i18n.t("recipe.image-drop-unsupported"));
  }

  function embedAsset(index: number, asset: RecipeAsset) {
    emit("update:assets", [...(assets ?? []), asset]);
    const assetUrl = recipeAssetPath(recipe.id, asset.fileName as string);
    const text = `<img src="${assetUrl}" height="100%" width="100%"/>`;
    instructionList.value[index].text += text;
  }

  function openImageUpload(index: number) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (input.files) {
        await handleImageDrop(index, Array.from(input.files));
        input.remove();
      }
    };
    input.click();
  }

  return (
    <>
  <section onKeyUp={undoMerge}>
    <BaseDialog value={dialog} onChange={setDialog} title={t('recipe.link-references')} icon={icons.link} width="100%" max-width="600px" max-height="60%">
      <div className="grid">
        <div className="sticky">
          <Card flat style="max-height: 40dvh; overflow-y: auto;">
            <CardContent className="pt-4">
              <p>
                {activeDialogStepText}
              </p>
              <Divider className="my-4" />
              <h4 className="ml-1">
                {t("recipe.ingredients")}
              </h4>
            </CardContent>
          </Card>
          <Divider />
        </div>
        <Card flat>
          <CardContent>
            {(Object.keys(groupedUnusedIngredients).length > 0) ? (
              <>
                <h4 className="ml-1">
                  {t("recipe.unlinked")}
                </h4>
                {groupedUnusedIngredients.map((ingredients, title) => (
                  <>
                    {(title) ? (
                      <h4 className="py-3 ml-1 pl-4">
                        {title}
                      </h4>
                    ) : null}
                    {ingredients.map(ing => (
                      <Checkbox key={ing.referenceId} value={activeRefs} onChange={setActiveRefs} value={ing.referenceId} className="ml-4">
                        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                        <>
                          <RecipeIngredientHtml ingredient={ing} scale={scale} />
                        </>
                      </Checkbox>
                    ))}
                  </>
                ))}
              </>
            ) : null}
            {(Object.keys(groupedUsedIngredients).length > 0) ? (
              <>
                <h4 className="py-3 ml-1">
                  {t("recipe.linked-to-other-step")}
                </h4>
                {groupedUsedIngredients.map((ingredients, title) => (
                  <>
                    {(title) ? (
                      <h4 className="py-3 ml-1 pl-4">
                        {title}
                      </h4>
                    ) : null}
                    {ingredients.map(ing => (
                      <Checkbox key={ing.referenceId} value={activeRefs} onChange={setActiveRefs} value={ing.referenceId} className="ml-4">
                        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                        <>
                          <RecipeIngredientHtml ingredient={ing} scale={scale} />
                        </>
                      </Checkbox>
                    ))}
                  </>
                ))}
              </>
            ) : null}
            <Divider className="my-4" />
            <h4 className="ml-1 mb-2">
              {t("recipe.notes")}
            </h4>
            {(linkableNotes.length === 0) ? (
              <p className="text-body-2 text-medium-emphasis">
                {t('recipe.no-notes-to-link')}
              </p>
            ) : null}
            {linkableNotes.map(note => (
              <Checkbox key={note.referenceId} value={activeNoteReferenceIds} onChange={setActiveNoteReferenceIds} value={note.referenceId} className="ml-4">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {note.title || t('recipe.note')}
                </>
              </Checkbox>
            ))}
          </CardContent>
        </Card>
      </div>
      <Divider />
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <div className="d-flex flex-grow-1">
          <BaseButton cancel onClick={closeDialog} />
          <Box sx={{ flexGrow: 1 }} />
          <div className="d-flex flex-wrap justify-end ga-2">
            <BaseButton color="info" onClick={autoSetReferences}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {icons.robot}
              </>
              {t("recipe.auto")}
            </BaseButton>
            <BaseButton save onClick={saveDialogLinks} />
            {(availableDialogNextStep) ? (
              <BaseButton className="ml-2 my-1" onClick={saveAndOpenNextDialogLinks}>
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {icons.forward}
                </>
                {t("recipe.nextStep")}
              </BaseButton>
            ) : null}
          </div>
        </div>
      </>
    </BaseDialog>
    <div className="d-flex justify-space-between justify-start">
      {(!isCookMode) ? (
        <h2 className="mt-1 text-h5 font-weight-medium opacity-80">
          {t("recipe.instructions")}
        </h2>
      ) : null}
      {(!isEditForm && !isCookMode) ? (
        <BaseButton minor cancel color="primary" onClick={toggleCookMode()}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {icons.primary}
          </>
          {t("recipe.cook-mode")}
        </BaseButton>
      ) : null}
    </div>
    {/* WF4-REVIEW: swipeable? */}
    <Drawer anchor="bottom" value={linkedNotesSheetOpen} onChange={setLinkedNotesSheetOpen} max-width="900" inset>
      <Card>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="d-flex align-center">
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={icons.noteTextOutline} size="20" className="mr-2" />
          {t('recipe.linked-notes-with-count', { count: activeStepLinkedNotes.length })}
          <Box sx={{ flexGrow: 1 }} />
          <Button icon variant="text" density="comfortable" aria-label={t('general.close')} onClick={() => setLinkedNotesSheetOpen(false)}>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.close} />
          </Button>
        </CardHeader>
        <Divider />
        <CardContent className="pt-4">
          {activeStepLinkedNotes.map((note, noteIndex) => (
            <>
              {(noteIndex > 0) ? (
                <Divider className="my-3" />
              ) : null}
              <div className="text-title-large mb-1">
                {note.title || t('recipe.note')}
              </div>
              <SafeMarkdown source={note.text} />
            </>
          ))}
        </CardContent>
      </Card>
    </Drawer>
    <VueDraggable value={instructionList} onChange={/* WF4-REVIEW: setter */ setInstructionList} disabled={!isEditForm} handle=".handle" delay={250} delay-on-touch-only={true} {...({
        animation: 200,
        group: 'recipe-instructions',
        ghostClass: 'ghost',
      })} onStart={() => setDrag(true)} onEnd={onDragEnd}>
      <TransitionGroup type="transition">
        {instructionList.map((step, index) => (
          <div key={step.id!} className="list-group-item">
            {(step.id && showTitleEditor[step.id]) ? (
              <Paper color="primary" className="mt-6 mb-2 d-flex align-center" className={isEditForm ? 'pa-2' : 'pa-3'} style="border-radius: 6px; cursor: pointer; width: 100%;" onClick={toggleCollapseSection(index)}>
                {(isEditForm) ? (
                  <>
                    {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "step.title" [J] */}
                    <TextField className="pa-0" density="compact" variant="solo" flat placeholder={t('recipe.section-title')} bg-color="primary" hide-details />
                  </>
                ) : (
                  <>
                    <Typography variant="h6" className="section-title-text">
                      {step.title}
                    </Typography>
                  </>
                )}
              </Paper>
            ) : null}
            {/* WF4-REVIEW: unmapped <v-hover> — judgement component, convert manually [J] */}
            <VHover>
              <Card className="my-3" className={[{ 'on-hover': isHovering }, { 'cursor-default': isEditForm }, isChecked(index)]} elevation={isHovering ? 12 : 2} ripple={false} onClick={toggleDisabled(index)}>
                {/* WF4-REVIEW: title text moves to the title prop */}
                <CardHeader className="recipe-step-title pt-3" className={!isChecked(index) ? 'pb-0' : 'pb-3'}>
                  <div className="d-flex align-center w-100">
                    {(isEditForm) ? (
                      /* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "step.summary" [J] */
                      <TextField className="headline" hide-details density="compact" variant="solo" flat placeholder={t('recipe.step-index', { step: index + 1 })}>
                        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                        <>
                          {/* WF4-REVIEW: icon name resolves via lib/icons */}
                          <MdiIcon name={icons.arrowUpDown} size="26" className="handle" />
                        </>
                      </TextField>
                    ) : (
                      <div className="summary-wrapper">
                        {(step.summary) ? (
                          <>
                            <SafeMarkdown className="pr-2" source={step.summary} />
                          </>
                        ) : (
                          <>
                            <span>
                              {t('recipe.step-index', { step: index + 1 })}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {(isEditForm) ? (
                      <>
                        <div className="ml-auto">
                          <BaseButtonGroup large={false} buttons={[
                          {
                            icon: icons.delete,
                            text: t('general.delete'),
                            event: 'delete',
                          },
                          {
                            icon: icons.dotsVertical,
                            text: '',
                            event: 'open',
                            children: [
                              {
                                text: sectionTitleLabel(step.id),
                                event: 'toggle-section',
                              },
                              {
                                text: t('recipe.link-references'),
                                event: 'link-references',
                              },
                              {
                                text: t('recipe.upload-image'),
                                event: 'upload-image',
                              },
                              {
                                icon: previewStates[index] ? icons.edit : icons.eye,
                                text: previewStates[index] ? t('recipe.edit-markdown') : t('markdown-editor.preview-markdown-button-label'),
                                event: 'preview-step',
                                divider: true,
                              },
                              {
                                text: t('recipe.merge-above'),
                                event: 'merge-above',
                              },
                              {
                                text: t('recipe.move-to-top'),
                                event: 'move-to-top',
                              },
                              {
                                text: t('recipe.move-to-bottom'),
                                event: 'move-to-bottom',
                              },
                              {
                                text: t('recipe.insert-above'),
                                event: 'insert-above',
                              },
                              {
                                text: t('recipe.insert-below'),
                                event: 'insert-below',
                              },
                            ],
                          },
                        ]} onMergeAbove={mergeAbove(index - 1, index)} onMoveToTop={moveTo('top', index)} onMoveToBottom={moveTo('bottom', index)} onInsertAbove={insert(index)} onInsertBelow={insert(index + 1)} onToggleSection={toggleShowTitle(step.id!)} onLinkReferences={openReferenceDialog(index)} onPreviewStep={togglePreviewState(index)} onUploadImage={openImageUpload(index)} onDelete={instructionList.splice(index, 1)} />
                        </div>
                      </>
                    ) : null}
                    {(!isEditForm) ? (
                      <div className="ml-auto d-flex align-center gap-1">
                        {(hasLinkedNotes(step) && !isCookMode) ? (
                          <Button variant="text" icon density="comfortable" size="small" onClick={(e) => { e.stopPropagation(); openLinkedNotesSheet(step); }}>
                            {/* WF4-REVIEW: icon name resolves via lib/icons */}
                            <MdiIcon name={icons.noteTextOutline} size="18" />
                            {/* WF4-REVIEW: activator slot variants [J] */}
                            <Tooltip activator="parent" location="top">
                              {t('recipe.linked-notes-with-count', { count: linkedNotesForStep(step).length })}
                            </Tooltip>
                          </Button>
                        ) : null}
                        {/* WF4-REVIEW: transition semantics */}
                        <Fade in={true}>
                          {/* WF4-REVIEW: icon name resolves via lib/icons */}
                          <MdiIcon name={icons.checkboxMarkedCircle} sx={{ display: (isChecked(index)) ? undefined : "none" }} size="24" color="success" />
                        </Fade>
                      </div>
                    ) : null}
                  </div>
                </CardHeader>
                {(isEditForm && loadingStates[index]) ? (
                  <LinearProgress active={true} indeterminate={true} />
                ) : null}
                <DropZone onDrop={(f) => handleImageDrop(index, f)} onDropUrl={(u) => handleImageUrlDrop(index, u)} onDropUnsupported={notifyUnsupportedDrop}>
                  {(isEditForm) ? (
                    <CardContent onClick={onClickInstructionField?.(`${index}.text`)}>
                      {/* WF4-REVIEW: v-model on complex expression "instructionList[index]['text']" [J]; v-model on complex expression "previewStates[index]" [J] */}
                      <MarkdownEditor className="mb-2" display-preview={false} textarea={{
                      hint: t('recipe.attach-images-hint'),
                      persistentHint: true,
                    }} />
                      {(step.ingredientReferences && step.ingredientReferences.length) ? (
                        <div className="linked-ingredients-editor">
                          {step.ingredientReferences.map((linkRef, i) => (
                            <div key={linkRef.referenceId ?? i} className="mb-1">
                              {(linkRef.referenceId && ingredientLookup[linkRef.referenceId]) ? (
                                <RecipeIngredientHtml ingredient={ingredientLookup[linkRef.referenceId]} scale={scale} />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {(step.noteReferences && step.noteReferences.length) ? (
                        <div className="linked-ingredients-editor mt-1">
                          {step.noteReferences.map((noteRef, i) => (
                            <div key={noteRef.referenceId ?? i} className="mb-1 d-flex align-center text-body-2">
                              {/* WF4-REVIEW: icon name resolves via lib/icons */}
                              <MdiIcon name={icons.noteTextOutline} size="14" className="mr-1" style="cursor: default;" />
                              {noteRef.referenceId != null ? (noteLookup[noteRef.referenceId] || t('recipe.note')) : ''}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  ) : null}
                </DropZone>
                {/* WF4-REVIEW: transition semantics */}
                <Collapse in={true}>
                  {(!isChecked(index) && !isEditForm) ? (
                    <div className="m-0 p-0">
                      <CardContent className="markdown">
                        <Grid container>
                          {(isCookMode && hasCookModeLinkedContent(step)) ? (
                            /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
                            <Grid cols="12" sm="5">
                              {(hasLinkedIngredients(step)) ? (
                                <div className="ml-n4">
                                  <RecipeIngredients value={recipe.recipeIngredient.filter((ing) => {
                              if (!step.ingredientReferences) return false
                              return step.ingredientReferences.map((ref) => ref.referenceId).includes(ing.referenceId || '')
                            })} scale={scale} is-cook-mode={isCookMode} storage-key={ingredientStorageKey} />
                                </div>
                              ) : null}
                              {(hasLinkedIngredients(step) && hasLinkedNotes(step)) ? (
                                <Divider className="my-3" />
                              ) : null}
                              {(hasLinkedNotes(step)) ? (
                                <div>
                                  {linkedNotesForStep(step).map((note, noteIndex) => (
                                    <>
                                      {(noteIndex > 0) ? (
                                        <Divider className="my-3" />
                                      ) : null}
                                      <div className="text-title-large mb-1">
                                        {note.title || t('recipe.note')}
                                      </div>
                                      <SafeMarkdown source={note.text} />
                                    </>
                                  ))}
                                </div>
                              ) : null}
                            </Grid>
                          ) : null}
                          {(isCookMode && hasCookModeLinkedContent(step) && $vuetify.display.smAndUp) ? (
                            <Divider vertical />
                          ) : null}
                          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                          <Grid>
                            <SafeMarkdown className="markdown" source={step.text} />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </div>
                  ) : null}
                </Collapse>
              </Card>
            </VHover>
          </div>
        ))}
      </TransitionGroup>
    </VueDraggable>
    {(!isCookMode) ? (
      <Divider className="mt-10 d-flex d-md-none" />
    ) : null}
  </section>
    </>
  );
}
