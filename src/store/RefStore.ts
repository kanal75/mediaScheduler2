// src/store/RefStore.ts
import { defineStore } from "pinia";

export const useRefStore = defineStore("RefStore", {
  state: () => ({
    isDarkMode: true,
    showSettingsPanel: false,
    showLayoutPanel: false,
    showAccountPanel: false,
    themeInstance: null as any, // This will hold the Vuetify theme instance
    showNewScheduleDialog: false,
    showMediaDialog: false,
    showSaveLayoutDialog: false,
    showSystemDialog: false, // Always true for now to show the dialog directly
  }),
  actions: {
    // Call this from a component's setup to store the Vuetify theme instance.
    setThemeInstance(themeInstance: any) {
      this.themeInstance = themeInstance;
    },
    // New action to set the theme explicitly
    setDarkMode(isDark: boolean) {
      this.isDarkMode = isDark;
      if (this.themeInstance) {
        // Update the Vuetify theme. Since `global.name` is a string, update it directly.
        this.themeInstance.global.name = isDark ? "dark" : "light";
      } else {
        console.warn("Vuetify theme instance is not set.");
      }
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
