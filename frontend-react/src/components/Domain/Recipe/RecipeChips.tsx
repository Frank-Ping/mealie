import { Chip } from "@mui/material";
import type { RecipeCategory, RecipeTag, RecipeTool } from "@/lib/api/types/recipe";
import { truncateText as truncatePlainText } from "@/lib/sanitize/text";

interface Props {
  truncate?: boolean;
  items?: RecipeCategory[] | RecipeTag[] | RecipeTool[];
  title?: boolean;
  urlPrefix?: UrlPrefixParam;
  limit?: number;
  small?: boolean;
  maxWidth?: string | null;
  onItemSelected?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
}

export type UrlPrefixParam = "tags" | "categories" | "tools";

export default function RecipeChips({ truncate = false, items = [], title = false, urlPrefix = "categories", limit = 999, small = false, maxWidth = null, onItemSelected }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  /* emits → props: onItemSelected */
  function truncateText(text: string, length = 20, clamp = "...") {
    if (!truncate) return text;
    return truncatePlainText(text, length, clamp);
  }

  return (
    <>
  {(items.length > 0) ? (
    <div>
      {(title) ? (
        <h2 className="mt-4">
          {title}
        </h2>
      ) : null}
      {items.slice(0, limit).map(category => (
        /* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-chip> */
        <Chip key={category.name} label className="mr-1 mt-1" color="accent" variant="flat" size={small ? 'small' : 'default'} onClick={(e) => { e.preventDefault(); onItemSelected?.(category, urlPrefix); }}>
          {truncateText(category.name)}
        </Chip>
      ))}
    </div>
  ) : null}
    </>
  );
}
