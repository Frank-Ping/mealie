import axios from "axios";

// Port of frontend/app/plugins/axios.ts without the Nuxt plugin wrapper.
// WF4-REVIEW [J]: the 401-refresh flow and token-cookie wiring land with the
// auth composable port (Phase D); the refresh must not depend on React render
// scope. Error-detail extraction below is copied verbatim from the Vue plugin.
export const apiClient = axios.create({
  baseURL: "/", // api calls already pass with /api
  withCredentials: true,
});

function getErrorDetailMessage(detail: unknown): string | null {
  if (detail && typeof detail === "object" && "message" in detail && typeof detail.message === "string") {
    return detail.message;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: unknown) => {
        if (!item || typeof item !== "object" || typeof (item as { msg?: unknown }).msg !== "string") {
          return null;
        }
        return (item as { msg: string }).msg;
      })
      .filter((message): message is string => typeof message === "string");
    return [...new Set(messages)].join("; ") || null;
  }
  return null;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = getErrorDetailMessage(error?.response?.data?.detail);
    if (errorMessage) {
      // WF4-REVIEW: route to the toast composable port (was alert.error)
      console.error(errorMessage);
    }
    return Promise.reject(error);
  },
);
