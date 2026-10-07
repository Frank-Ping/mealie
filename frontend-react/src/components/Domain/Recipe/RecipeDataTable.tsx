import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserAvatar from "../User/UserAvatar";
import RecipeChip from "./RecipeChips";
import type { Recipe, RecipeCategory, RecipeTool } from "@/lib/api/types/recipe";
import { useUserApi } from "@/composables/api";
import type { UserSummary } from "@/lib/api/types/user";
import type { RecipeTag } from "@/lib/api/types/household";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  loading?: boolean;
  recipes?: Recipe[];
  showHeaders?: ShowHeaders;
  search?: string;
}

interface ShowHeaders {
  id: boolean;
  owner: boolean;
  tags: boolean;
  categories: boolean;
  tools: boolean;
  recipeServings: boolean;
  recipeYieldQuantity: boolean;
  recipeYield: boolean;
  dateAdded: boolean;
}

export default function RecipeDataTable({ loading = false, recipes = [], showHeaders = ({
    id: true,
    owner: false,
    tags: true,
    categories: true,
    tools: true,
    recipeServings: true,
    recipeYieldQuantity: true,
    recipeYield: true,
    dateAdded: true, }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */,
  });

  defineEmits<{
    click: [];
  }>();

  const selected = defineModel<Recipe[]>({ default: () => [] });

  const i18n = useI18n();
  const auth = useMealieAuth();
  const groupSlug = auth.user?.groupSlug;
  const navigate = useNavigate();

  // Initialize sort state with default sorting by dateAdded descending
  const [sortBy, setSortBy] = useState([{ key: "dateAdded", order: "desc" as const }]);

  const headers = computed(() => {
    const hdrs: Array<{ title: string; value: string; align?: "center" | "start" | "end"; sortable?: boolean }> = [];

    if (showHeaders.id) {
      hdrs.push({ title: i18n.t("general.id"), value: "id" });
    }
    if (showHeaders.owner) {
      hdrs.push({ title: i18n.t("general.owner"), value: "userId", align: "center", sortable: true });
    }
    hdrs.push({ title: i18n.t("general.name"), value: "name", sortable: true });
    if (showHeaders.categories) {
      hdrs.push({ title: i18n.t("recipe.categories"), value: "recipeCategory", sortable: true });
    }

    if (showHeaders.tags) {
      hdrs.push({ title: i18n.t("tag.tags"), value: "tags", sortable: true });
    }
    if (showHeaders.tools) {
      hdrs.push({ title: i18n.t("tool.tools"), value: "tools", sortable: true });
    }
    if (showHeaders.recipeServings) {
      hdrs.push({ title: i18n.t("recipe.servings"), value: "recipeServings", sortable: true });
    }
    if (showHeaders.recipeYieldQuantity) {
      hdrs.push({ title: i18n.t("recipe.yield"), value: "recipeYieldQuantity", sortable: true });
    }
    if (showHeaders.recipeYield) {
      hdrs.push({ title: i18n.t("recipe.yield-text"), value: "recipeYield", sortable: true });
    }
    if (showHeaders.dateAdded) {
      hdrs.push({ title: i18n.t("general.date-added"), value: "dateAdded", sortable: true });
    }

    return hdrs;
  });

  // ============
  // Group Members
  const api = useUserApi();
  const [members, setMembers] = useState([]);

  async function refreshMembers() {
    const { data } = await api.groups.fetchMembers();
    if (data) {
      setMembers(data.items);
    }
  }

  function filterItems(item: RecipeTag | RecipeCategory | RecipeTool, itemType: string) {
    if (!groupSlug || !item.id) {
      return;
    }
    navigate(`/g/${groupSlug}?${itemType}=${item.id}`);
  }

  /* WF4-REVIEW [J] */ onMounted(() => {
    refreshMembers();
  });

  function getMember(id: string) {
    if (members[0]) {
      return members.find(m => m.id === id)?.fullName;
    }

    return i18n.t("general.none");
  }

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
  <VDataTable value={selected} onChange={/* WF4-REVIEW: setter */ setSelected} item-key="id" show-select sort-by={sortBy} headers={headers} items={recipes} items-per-page={15} className="elevation-0" loading={loading} search={search} return-object>
    <template>
      <a to={`/g/${groupSlug}/r/${item.slug}`} style="color: inherit; text-decoration: inherit; " onClick={onClick?.()}>
        {item.name}
      </a>
    </template>
    <template>
      <RecipeChip small items={item.tags!} is-category={false} url-prefix="tags" onItemSelected={filterItems} />
    </template>
    <template>
      <RecipeChip small items={item.recipeCategory!} onItemSelected={filterItems} />
    </template>
    <template>
      <RecipeChip small items={item.tools} url-prefix="tools" onItemSelected={filterItems} />
    </template>
    <template>
      <div className="d-flex align-center">
        <UserAvatar user-id={item.userId!} tooltip={false} size="40" />
        <div className="pl-2">
          <span className="text-left">
            {getMember(item.userId!)}
          </span>
        </div>
      </div>
    </template>
    <template>
      {item.dateAdded ? $d(new Date(item.dateAdded)) : ''}
    </template>
  </VDataTable>
    </>
  );
}
