import { useState } from "react";
import { useUserApi } from "@/composables/api";
import type { UserRatingSummary } from "@/lib/api/types/user";
import { useMealieAuth } from "@/composables/use-mealie-auth";

const [userRatings, setUserRatings] = useState([]);
const [loading, setLoading] = useState(false);
const [ready, setReady] = useState(false);

export function resetUserSelfRatings() {
  setUserRatings([]);
  setLoading(false);
  setReady(false);
}

export const useUserSelfRatings = function () {
  const auth = useMealieAuth();

  async function refreshUserRatings() {
    if (!auth.user || loading) {
      return;
    }

    setLoading(true);
    const api = useUserApi();

    const { data } = await api.users.getSelfRatings();
    setUserRatings(data?.ratings || []);

    setLoading(false);
    setReady(true);
  }

  async function setRating(slug: string, rating: number | null, isFavorite: boolean | null) {
    setLoading(true);
    const api = useUserApi();

    const userId = auth.user?.id || "";
    await api.users.setRating(userId, slug, rating, isFavorite);

    setLoading(false);
    await refreshUserRatings();
  }

  if (!ready) {
    refreshUserRatings();
  }

  return {
    userRatings,
    refreshUserRatings,
    setRating,
    ready,
  };
};
