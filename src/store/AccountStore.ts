// src/store/AccountStore.ts
import { defineStore } from "pinia";
import axios from "axios";
import { useNotificationStore } from "./NotificationStore";
import type { Layout, AccountSettings, Account } from "@/types";

// Define your API base URL based on the environment
const isProd = process.env.NODE_ENV === "production";
const baseURL = isProd
  ? window.location.origin + "/ROOT/MEDIASCHEDULER/"
  : "http://127.0.0.1/ROOT/MEDIASCHEDULER/";

export const useAccountStore = defineStore("AccountStore", {
  state: () => ({
    account: null as null | Account,
  }),
  actions: {
    // PUT the account to the backend.
    async putAccount(account: Account) {
      const notificationStore = useNotificationStore();
      try {
        const response = await axios.put(
          `${baseURL}/Accounts/Account[id='${account.id}']`,
          account
        );
        //notificationStore.showToast({
        //  severity: "success",
        //  summary: "Account",
        //  detail: "Account updated successfully.",
        //  life: 3000,
        //});
        return response.data;
      } catch (error) {
        notificationStore.showToast({
          severity: "error",
          summary: "Account",
          detail: "Error saving account.",
          life: 3000,
        });
        throw error;
      }
    },

    async register(accountData: Partial<Account>) {
      // Generate an ID if not provided
      const id = accountData.id || Math.random().toString(36).substr(2, 9);

      // Default settings
      const defaultSettings: AccountSettings = {
        isDarkMode: true,
        general: {
          sideBar: false,
          columnHoverHighlight: true,
          pagination: false,
          resizableColumns: true,
          sorting: true,
          filter: true,
          floatingFilter: false,
        },
      };

      // Merge provided settings with defaults
      const mergedSettings: AccountSettings = {
        ...defaultSettings,
        ...(accountData.settings || {}),
        general: {
          ...defaultSettings.general,
          ...(accountData.settings?.general || {}),
        },
      };

      // Create the new account object
      const newAccount: Account = {
        id,
        firstName: accountData.firstName || "",
        lastName: accountData.lastName,
        layouts: accountData.layouts || [],
        settings: mergedSettings,
      };

      // Remove putAccount call from registration
      this.account = newAccount;
      const notificationStore = useNotificationStore();
      notificationStore.showToast({
        severity: "success",
        summary: "Registration",
        detail: "Account registered successfully.",
        life: 3000,
      });
    },

    async signIn(id: string) {
      try {
        const response = await axios.get(
          `${baseURL}/Accounts/Account[id='${id}']?type=copy`
        );
        if (response.data && response.data.length > 0) {
          this.account = response.data[0];
          const notificationStore = useNotificationStore();
          notificationStore.showToast({
            severity: "success",
            summary: "Sign In",
            detail: "Signed in successfully by ID",
            life: 3000,
          });
        } else {
          const notificationStore = useNotificationStore();
          notificationStore.showToast({
            severity: "error",
            summary: "Sign In",
            detail: "Account not found",
            life: 3000,
          });
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Sign In",
          detail: "Sign in error.",
          life: 3000,
        });
      }
    },

    async signInByName(name: string) {
      try {
        const response = await axios.get(
          `${baseURL}/Accounts/Account[firstName='${name}']?type=copy`
        );
        if (response.data && response.data.length > 0) {
          this.account = response.data[0];
          const notificationStore = useNotificationStore();
          notificationStore.showToast({
            severity: "success",
            summary: "Sign In",
            detail: "Signed in successfully by Name",
            life: 3000,
          });
        } else {
          const notificationStore = useNotificationStore();
          notificationStore.showToast({
            severity: "error",
            summary: "Sign In",
            detail: "Account not found",
            life: 3000,
          });
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Sign In",
          detail: "Sign in error.",
          life: 3000,
        });
      }
    },

    logout() {
      this.account = null;
      const notificationStore = useNotificationStore();
      notificationStore.showToast({
        severity: "info",
        summary: "Logout",
        detail: "You have been logged out.",
        life: 3000,
      });
    },

    updateLayouts(newLayouts: Layout[]) {
      if (this.account) {
        this.account.layouts = newLayouts;
      }
    },

    updateSettings(newSettings: Partial<AccountSettings>) {
      if (this.account) {
        const current = this.account.settings;
        this.account.settings = {
          ...current,
          ...newSettings,
          general: {
            ...current.general,
            ...(newSettings.general || {}),
          },
        };
      }
    },

    // New layout management actions:

    // Save or update a layout.
    async saveLayout(layout: Layout) {
      if (!this.account) return;
      if (!this.account.layouts) {
        this.account.layouts = [];
      }
      const index = this.account.layouts.findIndex((l) => l.id === layout.id);
      if (index !== -1) {
        // Update existing layout.
        this.account.layouts[index] = { ...layout };
      } else {
        // Generate an ID if needed and add new layout.
        if (!layout.id) {
          layout.id = Math.random().toString(36).substr(2, 9);
        }
        this.account.layouts.push({ ...layout });
      }
      // Only update default if it changed
      if (layout.isDefault) {
        const alreadyDefault = this.account.layouts.find(
          (l) => l.isDefault && l.id === layout.id
        );
        if (!alreadyDefault) {
          this.account.layouts = this.account.layouts.map((l) =>
            l.id === layout.id
              ? { ...l, isDefault: true }
              : { ...l, isDefault: false }
          );
        }
      }
      return await this.putAccount(this.account);
    },

    // Delete a layout.
    async deleteLayout(layoutId: string) {
      if (!this.account) return;
      if (!this.account.layouts) this.account.layouts = [];
      this.account.layouts = this.account.layouts.filter(
        (l) => l.id !== layoutId
      );
      return await this.putAccount(this.account);
    },

    // Set a layout as default.
    async setDefaultLayout(layoutId: string) {
      if (!this.account || !this.account.layouts) return;
      this.account.layouts = this.account.layouts.map((l) =>
        l.id === layoutId
          ? { ...l, isDefault: true }
          : { ...l, isDefault: false }
      );
      // Force the account to update by creating a new object reference.
      this.account = { ...this.account };
      return await this.putAccount(this.account);
    },
  },
});
