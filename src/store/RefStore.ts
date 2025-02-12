import { defineStore } from "pinia";

export const useRefStore = defineStore("RefStore", {
  state: () => ({
    isLogInMenu: false as boolean,
    isDarkMode: Boolean(true),
  }),
  actions: {
    toggleLoginMenu() {
      this.isLogInMenu = !this.isLogInMenu;
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
    },
  },
});
