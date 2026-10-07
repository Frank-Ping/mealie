import { useLocation, useNavigate } from "react-router-dom";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function Image() {
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const navigate = useNavigate();
  const auth = useMealieAuth();

  // The image importer was folded into the AI importer, which takes images alongside other content.
  // Kept as a redirect so existing links and bookmarks still land somewhere useful.
  /* WF4-REVIEW [J] */ onMounted(() => {
    const groupSlug = route.params.groupSlug as string || auth.user?.groupSlug || "";
    navigate(/* WF4-REVIEW: replace+query */ `/g/${groupSlug}/r/create/ai`);
  });

  return (
    <>
  <div />
    </>
  );
}
