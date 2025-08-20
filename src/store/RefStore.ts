// src/store/RefStore.ts
import { defineStore } from "pinia";

export const useRefStore = defineStore("RefStore", {
  state: () => ({
    isDarkMode: true,
    showSettingsPanel: false,
    showLayoutPanel: false,
    showAccountPanel: false,
    showNewScheduleDialog: false,
    showMediaDialog: false,
    showSaveLayoutDialog: false,
    showSystemDialog: false, // Always true for now to show the dialog directly
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
  },
});
