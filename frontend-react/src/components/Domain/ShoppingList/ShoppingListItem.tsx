import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Container, FormControlLabel, Grid, List, ListItem, ListItemText, Tooltip } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useOnline } from "@vueuse/core";
import RecipeIngredientListItem from "../Recipe/RecipeIngredientListItem";
import ShoppingListItemEditor from "./ShoppingListItemEditor";
import RecipeList from "@/components/Domain/Recipe/RecipeList";
import type { ShoppingListItemOut } from "@/lib/api/types/household";
import type { MultiPurposeLabelOut } from "@/lib/api/types/labels";
import type { IngredientUnit, IngredientFood, RecipeSummary } from "@/lib/api/types/recipe";

interface Props {
  labels: unknown[];
  units: unknown[];
  foods: unknown[];
  recipes?: unknown;
  edit?: boolean;
}

type actions = { text: string; event: string };

type SwipeGesture = null | "scroll" | "swipe";

export default function ShoppingListItem({ labels, units, foods, recipes = undefined, edit = false }: Props) {
  const { t } = useTranslation();

  const model = defineModel<ShoppingListItemOut>({ type: Object as () => ShoppingListItemOut, required: true });

  const props = /* props via generated interface + destructured signature */

  const emit = defineEmits<{
    (e: "checked" | "save", item: ShoppingListItemOut): void;
    (e: "delete" | "edit" | "view"): void;
  }>();

  const SWIPE_THRESHOLD = 50;

  const { isRtl } = useRtl();
  const swipeRowRef = ref<InstanceType<typeof import("vuetify/components").VRow> | null>(null);

  /* WF4-REVIEW [J] */ onMounted(() => {
    const el = swipeRowRef?.$el as HTMLElement | undefined;
    if (!el) return;
    el.addEventListener(
      "touchmove",
      (e: TouchEvent) => {
        if (swipeInfo.gesture === "swipe") {
          e.preventDefault();
        }
      },
      { passive: false },
    );
  });
  const i18n = useI18n();
  const [displayRecipeRefs, setDisplayRecipeRefs] = useState(false);
  const online = useOnline();
  const isOffline = useMemo(() => online === false, []); // WF4-REVIEW: dependency array


  const [contextMenu, setContextMenu] = useState([
    { text: i18n.t("general.edit"); as string, event: "edit" },
    { text: i18n.t("general.delete") as string, event: "delete" },
  ]);

  // copy prop value so a refresh doesn't interrupt the user
  const [localListItem, setLocalListItem] = useState(Object.assign({}, model););

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const listItem = computed<ShoppingListItemOut>({
    get: () => model,
    set: (val: ShoppingListItemOut) => {
      setLocalListItem(val);
      model = val;
    },
  });

  function toggleChecked() {
    const updated = { ...model, checked: !model.checked } as ShoppingListItemOut;
    model = updated;
    emit("checked", updated);
  }

  function save() {
    emit("save", localListItem);
  }



  const [swipeInfo, setSwipeInfo] = useState({
    touchstartX: 0,
    touchstartY: 0,
    touchendX: 0,
    touchendY: 0,
    gesture: null as SwipeGesture,
  });

  function getSwipePoint(e: any) {
    const touch = e?.touches?.[0] ?? e?.changedTouches?.[0] ?? e;
    return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
  }

  function resetSwipe() {
    setSwipeInfo({ touchstartX: 0, touchstartY: 0, touchendX: 0, touchendY: 0, gesture: null });
  }

  function onSwipeStart(payload: any) {
    const { x, y } = getSwipePoint(payload.originalEvent);
    setSwipeInfo({ touchstartX: x, touchstartY: y, touchendX: x, touchendY: y, gesture: null });
  }

  function onSwipeMove(payload: any) {
    const { x, y } = getSwipePoint(payload.originalEvent);
    swipeInfo.touchendX = x;
    swipeInfo.touchendY = y;

    if (!swipeInfo.gesture) {
      const deltaX = Math.abs(x - swipeInfo.touchstartX);
      const deltaY = Math.abs(y - swipeInfo.touchstartY);
      if (deltaY > 8 && deltaY > deltaX) {
        swipeInfo.gesture = "scroll";
      }
      else if (deltaX > 8 && deltaX > deltaY) {
        swipeInfo.gesture = "swipe";
      }
      else if (deltaX > 8 || deltaY > 8) {
        // Diagonal / ambiguous — default to scroll
        swipeInfo.gesture = "scroll";
      }
    }
  }

  function onSwipeEnd() {
    if (swipeInfo.gesture === "swipe" && swiping >= SWIPE_THRESHOLD) {
      toggleChecked();
    }
    resetSwipe();
  }

  const swiping = useMemo(() =>  {
    if (swipeInfo.gesture !== "swipe", []); // WF4-REVIEW: dependency array {
      return 0;
    }
    const deltaX = isRtl
      ? swipeInfo.touchstartX - swipeInfo.touchendX
      : swipeInfo.touchendX - swipeInfo.touchstartX;
    return Math.max(0, Math.min(deltaX, 100));
  });

  const recipeList = computed<RecipeSummary[]>(() => {
    const ret: RecipeSummary[] = [];
    if (!listItem.recipeReferences) return ret;
    listItem.recipeReferences.forEach((ref) => {
      const recipe = recipes?.get(ref.recipeId);
      if (recipe) ret.push(recipe);
    });
    return ret;
  });

  return (
    <>
  <div style="overflow-x: hidden;">
    {(!edit) ? (
      <Container className="ml-2 pa-0" style={{
        transform: `translateX(${isRtl ? -swiping : swiping}px)`,
        transition: swiping === 0 ? 'transform 0.2s ease' : 'none',
        opacity: swiping >= SWIPE_THRESHOLD ? 0.5 : 1,
      }}>
        <Grid container ref="swipeRowRef" style="touch-action: pan-y;" no-gutters className="flex-nowrap align-center">
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid className="flex-grow-1 flex-shrink-1" style="min-width: 0;">
            <div className="d-flex align-center flex-nowrap">
              {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
              <FormControlLabel model-value={listItem.checked} hide-details density="compact" className="mt-0 flex-shrink-0" color="null" onClick={toggleChecked} />
              <div className="ml-2 text-truncate shopping-list-item__text" className={listItem.checked ? 'strike-through' : ''} style="min-width: 0;">
                <RecipeIngredientListItem ingredient={listItem} />
              </div>
            </div>
          </Grid>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="auto" className="text-right flex-shrink-0">
            {(!listItem.checked) ? (
              <div style="min-width: 72px">
                {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
                <VMenu offset-x start min-width="125px">
                  <template>
                    {(recipeList && recipeList.length) ? (
                      /* WF4-REVIEW: activator slot variants [J] */
                      <Tooltip open-delay="200" transition="slide-x-reverse-transition" density="compact" location="end" content-class="text-caption">
                        <template>
                          <Button size="small" variant="text" className="ml-2" icon {...(tooltipProps)} onClick={displayRecipeRefs = !displayRecipeRefs}>
                            {/* WF4-REVIEW: icon name resolves via lib/icons */}
                            <MdiIcon name={$globals.icons.silverwareForkKnife} />
                          </Button>
                        </template>
                        <span>
                          Toggle Recipes
                        </span>
                      </Tooltip>
                    ) : null}
                    <Button size="small" variant="text" className="ml-2" icon onClick={onEdit?.()}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={$globals.icons.edit} />
                    </Button>
                    <Button size="small" variant="text" className="handle" icon {...(hoverProps)}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={$globals.icons.arrowUpDown} />
                    </Button>
                  </template>
                  <List density="compact">
                    {contextMenu.map(action => (
                      /* WF4-REVIEW: @click → ListItemButton */
                      <ListItem key={action.event} density="compact" onClick={$emit(action.event as any)}>
                        {/* WF4-REVIEW: content → primary prop */}
                        <ListItemText>
                          {action.text}
                        </ListItemText>
                      </ListItem>
                    ))}
                  </List>
                </VMenu>
              </div>
            ) : null}
          </Grid>
        </Grid>
        {(!listItem.checked && recipeList && recipeList.length && displayRecipeRefs) ? (
          <Container className="pa-0">
            <RecipeList recipes={recipeList} list-item={listItem} disabled={isOffline} tile={true} />
          </Container>
        ) : null}
        {(listItem.checked) ? (
          <Grid container no-gutters className="mb-2">
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols="auto">
              <div className="text-caption font-weight-light font-italic">
                {t("shopping-list.completed-on", {
              date: listItem.updatedAt ? $d(new Date(listItem.updatedAt)) : '',
            })}
              </div>
            </Grid>
          </Grid>
        ) : null}
      </Container>
    ) : null}
    {(edit) ? (
      <div className="mb-4">
        <ShoppingListItemEditor value={localListItem} onChange={setLocalListItem} labels={labels} units={units} foods={foods} className="ma-2" onSave={save} onCancel={onView?.()} onDelete={onDelete?.()} />
      </div>
    ) : null}
  </div>
    </>
  );
}
