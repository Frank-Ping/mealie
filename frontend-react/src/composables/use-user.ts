import { useEffect, useState } from "react";
import { useAdminApi } from "@/composables/api";
import type { UserIn, UserOut } from "@/lib/api/types/user";

/*
TODO: Potentially combine useAllUsers and useUser by delaying the get all users functionality
Unsure how this could work but still be clear and functional. Perhaps by passing arguments to the useUsers function
to control whether the object is substantiated... but some of the others rely on it being substantiated...Will come back to this.
*/

export const useAllUsers = function () {
  const api = useAdminApi();
  const asyncKey = String(Date.now());
  const { data: users, refresh: refreshAllUsers } = useLazyAsyncData(asyncKey, async () => {
    const { data } = await api.users.getAll();
    if (data) {
      return data.items;
    }
    else {
      return null;
    }
  });

  return { users, refreshAllUsers };
};

export const useUser = function (refreshFunc: CallableFunction | null = null) {
  const api = useAdminApi();
  const [loading, setLoading] = useState(false);

  function getUser(id: string) {
    setLoading(true);
    const user = useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      const { data } = await api.users.getOne(id);
      if (cancelled) return;
            return data;
    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

    setLoading(false);
    return user;
  }

  async function createUser(payload: UserIn) {
    setLoading(true);
    const { data } = await api.users.createOne(payload);

    console.log(payload, data);

    if (refreshFunc) {
      refreshFunc();
    }

    setLoading(false);
    return data;
  }

  async function deleteUser(id: string) {
    setLoading(true);
    const { data } = await api.users.deleteOne(id);
    setLoading(false);

    if (refreshFunc) {
      refreshFunc();
    }

    return data;
  }

  async function updateUser(itemId: string, user: UserOut) {
    setLoading(true);
    const { data } = await api.users.updateOne(itemId, user);
    setLoading(false);

    if (refreshFunc) {
      refreshFunc();
    }

    return data;
  }

  return { loading, getUser, deleteUser, updateUser, createUser };
};
