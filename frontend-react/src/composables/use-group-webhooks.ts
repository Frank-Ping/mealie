import { useEffect, useState } from "react";
import { useAsyncKey } from "./use-utils";
import { useUserApi } from "@/composables/api";
import type { ReadWebhook } from "@/lib/api/types/household";

export const useGroupWebhooks = function () {
  const api = useUserApi();
  const [loading, setLoading] = useState(false);
  const [validForm, setValidForm] = useState(true);

  const actions = {
    getAll() {
      setLoading(true);
      const { data: units } = useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      const { data } = await api.groupWebhooks.getAll();
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
      const { data } = await api.groupWebhooks.getAll();

      if (data && data.items) {
        webhooks = data.items;
      }

      setLoading(false);
    },
    async createOne() {
      setLoading(true);

      const payload = {
        enabled: true,
        name: "New Webhook",
        url: "",
        scheduledTime: "00:00",
      };

      const { data } = await api.groupWebhooks.createOne(payload);
      if (data) {
        this.refreshAll();
      }

      setLoading(false);
    },
    async updateOne(updateData: ReadWebhook) {
      if (!updateData.id) {
        return;
      }

      // Convert to UTC time
      const [hours, minutes] = updateData.scheduledTime.split(":");

      const newDt = new Date();
      newDt.setHours(Number(hours));
      newDt.setMinutes(Number(minutes));

      updateData.scheduledTime = `${pad(newDt.getUTCHours(), 2)}:${pad(newDt.getUTCMinutes(), 2)}`;

      const payload = {
        ...updateData,
        scheduledTime: updateData.scheduledTime,
      };

      setLoading(true);
      const { data } = await api.groupWebhooks.updateOne(updateData.id, payload);
      if (data) {
        this.refreshAll();
      }
      setLoading(false);
    },

    async deleteOne(id: string | number) {
      setLoading(true);
      const { data } = await api.groupWebhooks.deleteOne(id);
      if (data) {
        this.refreshAll();
      }
      setLoading(false);
    },

    async testOne(id: string | number) {
      setLoading(true);
      await api.groupWebhooks.testOne(id);
      setLoading(false);
    },
  };

  const webhooks = actions.getAll();

  return { webhooks, actions, validForm };
};

function pad(num: number, size: number) {
  let numStr = num.toString();
  while (numStr.length < size) numStr = "0" + numStr;
  return numStr;
}

export function timeUTC(time: string): Date {
  const [hours, minutes] = time.split(":");
  const dt = new Date();
  dt.setUTCMinutes(Number(minutes));
  dt.setUTCHours(Number(hours));
  return dt;
}

export function timeUTCToLocal(time: string): string {
  const dt = timeUTC(time);
  return `${pad(dt.getHours(), 2)}:${pad(dt.getMinutes(), 2)}`;
}

export function timeLocalToUTC(time: string) {
  const [hours, minutes] = time.split(":");
  const dt = new Date();
  dt.setHours(Number(hours));
  dt.setMinutes(Number(minutes));
  return `${pad(dt.getUTCHours(), 2)}:${pad(dt.getUTCMinutes(), 2)}`;
}
