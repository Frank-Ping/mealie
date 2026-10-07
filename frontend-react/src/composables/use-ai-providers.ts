import { useState } from "react";
import { useUserApi } from "@/composables/api";
import type { AIProviderCreate, AIProviderUpdate } from "@/lib/api/types/group";

export function useAIProviders() {
  const api = useUserApi();
  const [loading, setLoading] = useState(false);

  async function getOne(id: string) {
    setLoading(true);
    try {
      return await api.aiProviders.getOne(id);
    }
    finally {
      setLoading(false);
    }
  }

  async function createOne(payload: AIProviderCreate) {
    setLoading(true);
    try {
      return await api.aiProviders.createOne(payload);
    }
    finally {
      setLoading(false);
    }
  }

  async function updateOne(id: string, payload: AIProviderUpdate) {
    setLoading(true);
    try {
      return await api.aiProviders.updateOne(id, payload);
    }
    finally {
      setLoading(false);
    }
  }

  async function deleteOne(id: string) {
    setLoading(true);
    try {
      return await api.aiProviders.deleteOne(id);
    }
    finally {
      setLoading(false);
    }
  }

  async function testOne(payload: AIProviderCreate) {
    return await api.aiProviders.testOne(payload);
  }

  async function testSavedOne(id: string, overrides?: AIProviderUpdate & { apiKey?: string }) {
    return await api.aiProviders.testSavedOne(id, overrides);
  }

  return {
    loading: readonly(loading),
    getOne,
    createOne,
    updateOne,
    deleteOne,
    testOne,
    testSavedOne,
  };
}
