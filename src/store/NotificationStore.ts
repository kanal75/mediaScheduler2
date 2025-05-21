// src/store/NotificationStore.ts
import { defineStore } from "pinia";

export const useNotificationStore = defineStore("NotificationStore", {
  state: () => ({
    toast: null as null | {
      severity: string;
      summary: string;
      detail: string;
      life?: number;
      group?: string;
    },
  }),
  actions: {
    showToast(toast: {
      severity: string;
      summary: string;
      detail: string;
      life?: number;
      group?: string;
    }) {
      this.toast = { ...toast, group: "tc" };
    },
    clearToast() {
      this.toast = null;
    },
  },
});
