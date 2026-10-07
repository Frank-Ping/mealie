import { useState } from "react";
import type { ShoppingListSummary } from "@/lib/api/types/household";
import { useUserApi } from "../api";

export function useAddToShoppingListDialog() {
  const api = useUserApi();
  const [shoppingLists, setShoppingLists] = useState(undefined);
  const [open, setOpen] = useState(false);
  const [addAllLoading, setAddAllLoading] = useState(false);

  async function getShoppingLists() {
    const { data } = await api.shopping.lists.getAll(1, -1, { orderBy: "name", orderDirection: "asc" });
    if (data) {
      setShoppingLists(data.items as ShoppingListSummary[] ?? []);
    }
  }

  async function addAllToList() {
    setAddAllLoading(true);
    await getShoppingLists();
    setOpen(true);
    setAddAllLoading(false);
  }

  return {
    shoppingLists,
    open,
    addAllLoading,
    getShoppingLists,
    addAllToList,
  };
}
