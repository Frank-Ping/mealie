import { useLocation, useNavigate } from "react-router-dom";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function CreatePage() {
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const navigate = useNavigate();
  const auth = useMealieAuth();

  /* WF4-REVIEW [J] */ onMounted(() => {
    // Force redirect to first valid page
    const groupSlug = route.params.groupSlug as string || auth.user?.groupSlug || "";
    navigate(/* WF4-REVIEW: replace+query */ `/g/${groupSlug}/r/create/url`);
  });

  return (
    <>
  <div />
    </>
  );
}
