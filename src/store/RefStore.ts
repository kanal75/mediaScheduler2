// src/store/RefStore.ts
import { defineStore } from "pinia";
import type { SystemFormModel } from "@/types";

export const useRefStore = defineStore("RefStore", {
  state: () => ({
    isDarkMode: true,
    showSettingsPanel: false,
    showLayoutPanel: false,
    showAccountPanel: false,
    showNewScheduleDialog: false,
    showMediaDialog: false,
    mediaDialogDismissed: false,
    loadingMedia: false,
    showSaveLayoutDialog: false,
    showSystemDialog: false, // Always true for now to show the dialog directly
    showSystemEditDialog: false,
    systemEditModel: null as SystemFormModel | null,
    systemEditContext: null as {
      id: string;
      profile: string;
      scheduleTypes: string;
    } | null,
    // Track currently selected layout independently from default
    currentLayoutId: null as string | null,
  }),
  actions: {
    // New action to set the theme explicitly
    setDarkMode(isDark: boolean) {
      this.isDarkMode = isDark;
    },
    // Optionally, you can keep toggleDarkMode for backward compatibility:
    toggleDarkMode() {
      this.setDarkMode(!this.isDarkMode);
    },
    toggleSettingsPanel() {
      this.showSettingsPanel = !this.showSettingsPanel;
      this.showLayoutPanel = false;
      this.showAccountPanel = false;
    },
    toggleLayoutPanel() {
      this.showLayoutPanel = !this.showLayoutPanel;
      this.showSettingsPanel = false;
      this.showAccountPanel = false;
    },
    toggleAccountPanel() {
      this.showAccountPanel = !this.showAccountPanel;
      this.showSettingsPanel = false;
      this.showLayoutPanel = false;
    },
    toggleNewScheduleDialog() {
      this.showNewScheduleDialog = !this.showNewScheduleDialog;
    },
    toggleSaveLayoutDialog() {
      this.showSaveLayoutDialog = !this.showSaveLayoutDialog;
    },
    toggleSystemDialog() {
      this.showSystemDialog = !this.showSystemDialog;
    },
    toggleSystemEditDialog() {
      this.showSystemEditDialog = !this.showSystemEditDialog;
    },
    openSystemEdit(
      model: SystemFormModel,
      ctx: { id: string; profile: string; scheduleTypes: string }
    ) {
      this.systemEditModel = model;
      this.systemEditContext = ctx;
      this.showSystemEditDialog = true;
    },
    closeSystemEdit() {
      this.showSystemEditDialog = false;
      this.systemEditModel = null;
      this.systemEditContext = null;
    },
    // Layout selection persistence
    setCurrentLayoutId(id: string | null) {
      this.currentLayoutId = id;
      try {
        if (id) {
          localStorage.setItem("ms2.currentLayoutId", id);
        } else {
          localStorage.removeItem("ms2.currentLayoutId");
        }
      } catch (_) {
        // ignore storage errors
      }
    },
    loadFromStorage() {
      try {
        const saved = localStorage.getItem("ms2.currentLayoutId");
        if (saved) this.currentLayoutId = saved;
      } catch (_) {
        // ignore storage errors
      }
    },
  },
});
