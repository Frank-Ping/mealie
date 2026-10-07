import { useEffect, useState } from "react";
import { useAsyncKey } from "../use-utils";
import { useUserApi } from "@/composables/api";
import type { VForm } from "@/types/vuetify";
import type { RecipeTool } from "@/lib/api/types/recipe";

export const useTools = function (eager = true) {
  const workingToolData = reactive<RecipeTool>({
    id: "",
    name: "",
    slug: "",
  });

  const api = useUserApi();
  const [loading, setLoading] = useState(false);
  const [validForm, setValidForm] = useState(false);

  const actions = {
    getAll() {
      setLoading(true);
      const units = useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      const { data } = await api.tools.getAll();
      if (cancelled) return;

              if (data) {
                return data.items;
              }
              else {
                return null;
              }
    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

      setLoading(false);
      return units;
    },

    async refreshAll() {
      setLoading(true);
      const { data } = await api.tools.getAll();

      if (data) {
        tools = data.items;
      }

      setLoading(false);
    },

    async createOne(domForm: VForm | null = null) {
      if (domForm && !domForm.validate()) {
        setValidForm(false);
      }

      setLoading(true);

      const { data } = await api.tools.createOne(workingToolData);

      if (data) {
        tools?.push(data);
      }

      domForm?.reset();
      this.reset();
    },

    async updateOne() {
      setLoading(true);
      const { data } = await api.tools.updateOne(workingToolData.id, workingToolData);
      if (data) {
        tools?.push(data);
      }
      this.reset();
    },

    async deleteOne(id: number) {
      setLoading(true);
      await api.tools.deleteOne(id);
      this.reset();
    },

    reset() {
      workingToolData.name = "";
      workingToolData.id = "";
      setLoading(false);
      setValidForm(true);
    },
  };

  const tools = (() => {
    if (eager) {
      return actions.getAll();
    }
    else {
      return ref([]);
    }
  })();

  return {
    tools,
    actions,
    workingToolData,
    loading,
  };
};
