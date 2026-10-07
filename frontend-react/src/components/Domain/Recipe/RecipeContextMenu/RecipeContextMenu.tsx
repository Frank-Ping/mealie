import { useState } from "react";
import { Button } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import type { Recipe } from "@/lib/api/types/recipe";
import type { ContextMenuIncludes } from "./RecipeContextMenuContent";

interface Props {
  useItems?: Partial<ContextMenuIncludes>;
  appendItems?: ContextMenuItem[];
  leadingItems?: ContextMenuItem[];
  menuTop?: boolean;
  fab?: boolean;
  color?: string;
  slug: string;
  menuIcon?: string | null;
  name: string;
  recipe?: Recipe;
  recipeId: string;
  recipeScale?: number;
}

export interface ContextMenuItem {
  title: string;
  icon: string;
  color?: string;
  event: string;
  isPublic: boolean;
}

export default function RecipeContextMenu({ useItems = ({
    delete: true,
    edit: true,
    download: true,
    duplicate: false,
    mealplanner: true,
    shoppingList: true,
    print: true,
    printPreferences: true,
    share: true,
    recipeActions: true, }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */,
    appendItems: () => [],
    leadingItems: () => [],
    menuTop: true,
    fab: false,
    color: "primary",
    menuIcon: null,
    recipe: undefined,
    recipeScale: 1,
  });

  defineEmits<{
    [key: string]: any;
    print: [];
    deleted: [slug: string];
    mealplanRemove: [];
    mealplanEdit: [];
  }>();

  // icons imported directly (was $globals)

  const [isMenuContentLoaded, setIsMenuContentLoaded] = useState(false);

  const icon = computed(() => {
    return menuIcon || icons.dotsVertical;
  });

  // Props to pass to the content component (excluding internal wrapper props)
  const contentProps = computed(() => {
    const { ...rest } = props;
    return rest;
  });

  function onMenuToggle(isOpen: boolean) {
    if (isOpen && !isMenuContentLoaded) {
      setIsMenuContentLoaded(true);
    }
  }

  const RecipeContextMenuContent = defineAsyncComponent(
    () => import("./RecipeContextMenuContent.vue"),
  );

  return (
    <>
  <div className="text-center">
    {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
    <VMenu offset-y start eager={isMenuContentLoaded} bottom={!menuTop} nudge-bottom={!menuTop ? '5' : '0'} top={menuTop} nudge-top={menuTop ? '5' : '0'} allow-overflow close-delay="125" content-class="d-print-none" onUpdateModelValue={onMenuToggle}>
      <template>
        <Button icon variant={fab ? 'flat' : undefined} rounded={fab ? 'circle' : undefined} size={fab ? 'small' : undefined} color={fab ? 'info' : 'secondary'} fab={fab} {...(activatorProps)} onClick={(e) => { e.preventDefault(); ; }}>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={icon} size={!fab ? undefined : 'x-large'} color={fab ? 'white' : 'secondary'} />
        </Button>
      </template>
      {(isMenuContentLoaded) ? (
        <RecipeContextMenuContent {...(contentProps)} onPrint={onPrint?.()} onDeleted={onDeleted?.($event)} onMealplanEdit={onMealplanEdit?.()} onMealplanRemove={onMealplanRemove?.()} />
      ) : null}
    </VMenu>
  </div>
    </>
  );
}
