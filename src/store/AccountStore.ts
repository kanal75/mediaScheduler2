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
    // --- Queued save infrastructure state (Phase 2) ---
    _saveQueue: [] as Array<() => Promise<void>>,
    _saveInFlight: false,
    _pendingLayoutsDirty: false,
    _lastSaveAt: 0,
    _MIN_INTERVAL_MS: 800,
    lastAccountSaveAt: 0, // public timestamp for UI indicators
  }),
  getters: {
    hasPendingAccountSave(state): boolean {
      return (
        state._saveQueue.length > 0 ||
        state._saveInFlight ||
        state._pendingLayoutsDirty
      );
    },
    lastSaveAgeMs(state): number {
      return state.lastAccountSaveAt
        ? Date.now() - state.lastAccountSaveAt
        : Infinity;
    },
  },
  actions: {
    async _drainQueue() {
      if (this._saveInFlight) return;
      const next = this._saveQueue.shift();
      if (!next) return;
      this._saveInFlight = true;
      try {
        await next();
      } finally {
        this._saveInFlight = false;
        if (this._saveQueue.length > 0) {
          this._drainQueue();
        }
      }
    },
    queueAccountSave(reason: string) {
      // Coalesce rapid layout-only updates
      const now = Date.now();
      if (now - this._lastSaveAt < this._MIN_INTERVAL_MS) {
        // Delay scheduling by pushing a lazy job if not already pending
        if (!this._pendingLayoutsDirty) {
          this._pendingLayoutsDirty = true;
          setTimeout(() => {
            if (this._pendingLayoutsDirty) {
              this._pendingLayoutsDirty = false;
              this._enqueueDirectSave(reason + "+coalesced");
            }
          }, this._MIN_INTERVAL_MS);
        }
        return;
      }
      this._enqueueDirectSave(reason);
    },
    _enqueueDirectSave(reason: string) {
      if (!this.account) return;
      // Defensive: ensure queue is an array (hot-reload / earlier misplacement safeguard)
      if (!Array.isArray(this._saveQueue)) {
        (this as any)._saveQueue = [];
      }
      const snapshot = JSON.stringify(this.account.layouts?.map((l) => l.id));
      this._saveQueue.push(async () => {
        this._lastSaveAt = Date.now();
        try {
          await this.putAccount(this.account!);
          this.lastAccountSaveAt = Date.now();
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV !== "production")
            console.log(
              "[AccountStore] saved account (reason:",
              reason,
              "layouts:",
              snapshot,
              ")"
            );
        } catch (e) {
          // errors already toasted in putAccount
        }
      });
      this._drainQueue();
    },
    queueLayoutsSave() {
      this.queueAccountSave("layouts");
    },
    // Normalize account payloads from backend (e.g., layout.state may be a JSON string)
    normalizeAccountPayload(account: Account | null | undefined) {
      if (!account) return account;
      if (Array.isArray(account.layouts)) {
        account.layouts = account.layouts.map((l) => {
          const next = { ...l } as Layout & { state?: unknown };
          if (
            next != null &&
            typeof (next as any).state === "string" &&
            (next as any).state !== ""
          ) {
            try {
              (next as any).state = JSON.parse((next as any).state as string);
            } catch (e) {
              // leave as-is if parsing fails
            }
          }
          return next as Layout;
        });
      }
      return account;
    },
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
        this.account = this.normalizeAccountPayload(newAccount) as Account;
        notificationStore.showToast({
          severity: "success",
          summary: "Registration",
          detail: "Account created successfully.",
          life: 3000,
        });
      } catch (error) {
        // Graceful fallback: keep working locally if backend is unavailable
        this.account = this.normalizeAccountPayload(newAccount) as Account;
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
          this.account = this.normalizeAccountPayload(
            response.data[0]
          ) as Account;
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
          this.account = this.normalizeAccountPayload(
            response.data[0]
          ) as Account;
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
      // Ensure version tag
      (layout as any).layoutVersion = (layout as any).layoutVersion || 1;
      // Always work with a deep-cloned state snapshot to avoid shared object references between layouts.
      let clonedState: any;
      try {
        clonedState =
          layout.state != null
            ? JSON.parse(JSON.stringify(layout.state))
            : null;
      } catch (e) {
        clonedState = layout.state; // fallback if circular
      }
      // Bump stateRevision when state content changes (simple increment; AGgrid increments internally too).
      const incomingRevision = (layout as any).stateRevision || 0;
      const index = this.account.layouts.findIndex((l) => l.id === layout.id);
      if (index !== -1) {
        // Update existing layout.
        const prev = this.account.layouts[index] as any;
        let nextRevision = incomingRevision;
        // If state JSON differs, increment revision so apply logic re-runs
        try {
          const prevJson = JSON.stringify(prev.state);
          const newJson = JSON.stringify(clonedState);
          if (prevJson !== newJson) {
            nextRevision = (prev.stateRevision || 0) + 1;
          }
        } catch {
          nextRevision = (prev.stateRevision || 0) + 1;
        }
        this.account.layouts[index] = {
          ...layout,
          state: clonedState,
          stateRevision: nextRevision,
        } as any;
      } else {
        // Generate an ID if needed and add new layout.
        if (!layout.id) {
          layout.id = Math.random().toString(36).substr(2, 9);
        }
        // If no state was provided for a brand-new layout, fall back to the default state (deep-cloned)
        if (layout.state == null) {
          layout.state = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_STATE));
        }
        this.account.layouts.push({
          ...layout,
          state: clonedState != null ? clonedState : layout.state,
          stateRevision: incomingRevision || 0,
        } as any);
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
      this.queueLayoutsSave();
      return this.account.layouts.find((l) => l.id === layout.id);
    },
    // Ensure every existing layout has a numeric stateRevision (one-time or lazy call)
    ensureStateRevisions() {
      if (!this.account || !Array.isArray(this.account.layouts)) return;
      let changed = false;
      this.account.layouts = this.account.layouts.map((l: any) => {
        if (l.stateRevision == null) {
          changed = true;
          return { ...l, stateRevision: 0 };
        }
        return l;
      });
      if (changed) {
        this.account = { ...this.account };
      }
    },

    // Export selected (or all) layouts as a JSON string
    exportLayouts(layoutIds?: string[]): string {
      if (!this.account) return "[]";
      const all = this.account.layouts || [];
      const selected = Array.isArray(layoutIds)
        ? all.filter((l) => layoutIds.includes(l.id))
        : all;
      const minimal = selected.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        isDefault: l.isDefault,
        layoutVersion: (l as any).layoutVersion || 1,
        state: l.state,
      }));
      return JSON.stringify({
        type: "mediaSchedulerLayouts",
        version: 1,
        exportedAt: new Date().toISOString(),
        count: minimal.length,
        layouts: minimal,
      });
    },

    // Import layouts from JSON; returns number imported
    importLayoutsFromJson(json: string): number {
      if (!this.account) return 0;
      const notificationStore = useNotificationStore();
      let parsed: any;
      try {
        parsed = JSON.parse(json);
      } catch (e) {
        notificationStore.showToast({
          severity: "error",
          summary: "Import Layouts",
          detail: "Invalid JSON",
          life: 4000,
        });
        return 0;
      }
      if (
        !parsed ||
        parsed.type !== "mediaSchedulerLayouts" ||
        !Array.isArray(parsed.layouts)
      ) {
        notificationStore.showToast({
          severity: "error",
          summary: "Import Layouts",
          detail: "Unsupported file format",
          life: 4000,
        });
        return 0;
      }
      const existing = this.account.layouts || [];
      let imported = 0;
      parsed.layouts.forEach((raw: any) => {
        if (!raw || typeof raw !== "object") return;
        if (!raw.name || raw.state == null) return; // basic validation
        // If ID collides, generate a new one
        const id =
          raw.id && !existing.some((l) => l.id === raw.id)
            ? raw.id
            : Math.random().toString(36).substr(2, 9);
        const layout: Layout = {
          id,
          name: String(raw.name).slice(0, 100),
          description: raw.description
            ? String(raw.description).slice(0, 200)
            : undefined,
          state: raw.state,
          isDefault: !!raw.isDefault,
        };
        (layout as any).layoutVersion = raw.layoutVersion || 1;
        existing.push(layout);
        imported++;
      });
      // Enforce only one default
      const defaults = existing.filter((l) => l.isDefault);
      if (defaults.length > 1) {
        // Keep the first encountered, unset the rest
        let keep = true;
        for (const l of defaults) {
          if (keep) {
            keep = false;
          } else {
            l.isDefault = false;
          }
        }
      }
      this.account.layouts = [...existing];
      if (imported > 0) this.queueLayoutsSave();
      notificationStore.showToast({
        severity: imported ? "success" : "warn",
        summary: "Import Layouts",
        detail: imported
          ? `Imported ${imported} layout(s).`
          : "No layouts imported.",
        life: 4000,
      });
      return imported;
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
      this.queueLayoutsSave();
    },

    // Utility: re-clone all layout.state objects to ensure no unintended shared references.
    repairLayoutStateIsolation() {
      if (!this.account || !Array.isArray(this.account.layouts)) return;
      this.account.layouts = this.account.layouts.map((l) => {
        let cloned = l.state;
        try {
          cloned =
            l.state != null ? JSON.parse(JSON.stringify(l.state)) : l.state;
        } catch (e) {
          // keep original if cloning fails (e.g., circular refs)
        }
        return { ...l, state: cloned };
      });
      this.account = { ...this.account };
      this.queueLayoutsSave();
    },
  },
});
