// src/store/AccountStore.ts
import { defineStore } from "pinia";
import axios from "axios";
import { useNotificationStore } from "./NotificationStore";
import type { Layout, AccountSettings, Account } from "@/types";
import { DEFAULT_LAYOUT_STATE } from "@/constants/defaultLayout";

// Define your API base URL based on the environment (no trailing slash to prevent // in paths)
const isProd = process.env.NODE_ENV === "production";
const baseURL = isProd
  ? window.location.origin + "/ROOT/MEDIASCHEDULER"
  : "http://127.0.0.1/ROOT/MEDIASCHEDULER";

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

      const defaultLayout: Layout = {
        id: Math.random().toString(36).substr(2, 9),
        name: accountData.firstName || "Default",
        description: "Auto-created on registration",
        state: JSON.parse(JSON.stringify(DEFAULT_LAYOUT_STATE)),
        isDefault: true,
      };

      // Create the new account object with an initial default layout
      const newAccount: Account = {
        id,
        firstName: accountData.firstName || "",
        lastName: accountData.lastName,
        layouts:
          Array.isArray(accountData.layouts) && accountData.layouts.length > 0
            ? accountData.layouts
            : [defaultLayout],
        settings: mergedSettings,
      };

      // Persist the account on the backend so it exists for future updates/sign-ins
      const notificationStore = useNotificationStore();
      try {
        await axios.put(
          `${baseURL}/Accounts/Account[id='${newAccount.id}']`,
          newAccount
        );
        this.account = newAccount;
        notificationStore.showToast({
          severity: "success",
          summary: "Registration",
          detail: "Account created successfully.",
          life: 3000,
        });
      } catch (error) {
        // Graceful fallback: keep working locally if backend is unavailable
        this.account = newAccount;
        notificationStore.showToast({
          severity: "warn",
          summary: "Registration",
          detail: "Account created locally; server save failed.",
          life: 4000,
        });
      }
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
        // If no state was provided for a brand-new layout, fall back to the default state (deep-cloned)
        if (layout.state == null) {
          layout.state = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_STATE));
        }
        this.account.layouts.push({ ...layout });
      }
      // Enforce a single default: if this layout is marked default, unmark others.
      if (layout.isDefault) {
        this.account.layouts = this.account.layouts.map((l) =>
          l.id === layout.id
            ? { ...l, isDefault: true }
            : { ...l, isDefault: false }
        );
      }
      // Ensure at least one default exists (pick the first if none)
      if (!this.account.layouts.some((l) => l.isDefault)) {
        const [first] = this.account.layouts;
        if (first) first.isDefault = true;
      }
      // Persist and return the saved layout (with final ID) for callers to select
      await this.putAccount(this.account);
      return this.account.layouts.find((l) => l.id === layout.id);
    },

    // Delete a layout.
    async deleteLayout(layoutId: string) {
      if (!this.account) return;
      if (!this.account.layouts) this.account.layouts = [];
      const wasDefault = this.account.layouts.find(
        (l) => l.id === layoutId
      )?.isDefault;
      this.account.layouts = this.account.layouts.filter(
        (l) => l.id !== layoutId
      );
      // If we deleted the default or no default remains, set the first as default
      if (this.account.layouts.length > 0) {
        const hasDefault = this.account.layouts.some((l) => l.isDefault);
        if (wasDefault || !hasDefault) {
          this.account.layouts = this.account.layouts.map((l, idx) => ({
            ...l,
            isDefault: idx === 0,
          }));
        }
      }
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
