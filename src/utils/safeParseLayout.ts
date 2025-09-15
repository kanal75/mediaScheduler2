import { useNotificationStore } from "@/store/NotificationStore";

export function safeParseLayoutState(raw: unknown): unknown | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string" && raw.trim() === "") return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (e) {
      try {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Layout",
          detail: "Invalid layout state JSON.",
          life: 3000,
        });
      } catch (_) {
        // ignore secondary errors
      }
      return null;
    }
  }
  return null;
}
