<template>
  <div class="toolbar p-2 surface-card shadow-2 flex align-center">
    <div class="mr-3 font-semibold">Media Scheduler 2</div>
    <div class="flex-1"></div>
    <Button
      class="p-button-rounded p-button-text"
      v-tooltip.bottom="'New Schedule'"
      :disabled="!accountStore.account"
      @click="showNewScheduleDialog"
      aria-label="New Schedule"
    >
      <template #icon>
        <Icon name="plus" />
      </template>
    </Button>
    <Button
      class="p-button-rounded p-button-text ml-2"
      v-tooltip.bottom="'Settings'"
      :disabled="!accountStore.account"
      @click="refStore.toggleSettingsPanel"
      aria-label="Settings"
    >
      <template #icon>
        <Icon name="cog" />
      </template>
    </Button>
    <Button
      class="p-button-rounded p-button-text ml-2"
      v-tooltip.bottom="'Layouts'"
      :disabled="!accountStore.account"
      @click="refStore.toggleLayoutPanel"
      aria-label="Layouts"
    >
      <template #icon>
        <Icon name="grid" />
      </template>
    </Button>
    <Button
      class="p-button-rounded p-button-text ml-2"
      v-tooltip.bottom="'Theme'"
      @click="toggleTheme"
      aria-label="Toggle Theme"
    >
      <template #icon>
        <Icon :name="refStore.isDarkMode ? 'moon' : 'sun'" />
      </template>
    </Button>
    <Button
      class="p-button-rounded p-button-text ml-2"
      v-tooltip.bottom="'Profile'"
      @click="refStore.toggleAccountPanel"
      aria-label="Profile"
    >
      <template #icon>
        <Avatar
          v-if="account"
          :label="initials"
          class="bg-green-500 text-white"
          size="small"
          shape="circle"
        />
        <Icon v-else name="user" />
      </template>
    </Button>
  </div>
  <SettingsPanel v-if="refStore.showSettingsPanel" />
  <!-- LayoutPanel is lazy-loaded and rendered in DashBoard to avoid duplicate instances -->
  <AccountPanel v-if="refStore.showAccountPanel" />
  <NewScheduleDialog v-if="refStore.showNewScheduleDialog" />
</template>

<script lang="ts">
import { defineComponent, computed, defineAsyncComponent } from "vue";
import Icon from "@/components/icons/Icon.vue";
// PrimeVue tooltip directive is registered globally in main.ts
import { useRefStore } from "@/store/RefStore";
import { useRootStore } from "@/store/RootStore";
import { useAccountStore } from "@/store/AccountStore";
// Lazy-load non-critical UI so they don't ship on first screen
const SettingsPanel = defineAsyncComponent(() => import("./SettingsPanel.vue"));
const AccountPanel = defineAsyncComponent(() => import("./AccountPanel.vue"));
const NewScheduleDialog = defineAsyncComponent(
  () => import("./NewSchedule/NewScheduleDialog.vue")
);

export default defineComponent({
  name: "ToolBar",
  components: { AccountPanel, SettingsPanel, NewScheduleDialog, Icon },
  setup() {
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const accountStore = useAccountStore();
    // PrimeVue directives registered globally in main.ts

    const account = computed(() => accountStore.account);
    const initials = computed(() => {
      if (!account.value) return "";
      const first = account.value.firstName
        ? account.value.firstName.charAt(0).toUpperCase()
        : "";
      const last = account.value.lastName
        ? account.value.lastName.charAt(0).toUpperCase()
        : "";
      return first + last;
    });

    const toggleTheme = () => {
      if (account.value) {
        const newIsDark = !account.value.settings.isDarkMode;
        accountStore.updateSettings({ isDarkMode: newIsDark });
        refStore.setDarkMode(newIsDark);
      } else {
        // Fallback if no account is logged in.
        refStore.toggleDarkMode();
      }
      document.documentElement.classList.toggle(
        "app-dark",
        refStore.isDarkMode
      );
    };
    const showNewScheduleDialog = () => {
      rootStore.fetchProfiles();
      rootStore.fetchScheduleTypes();
      refStore.showNewScheduleDialog = true;
    };
    return {
      refStore,
      accountStore,
      account,
      initials,
      toggleTheme,
      showNewScheduleDialog,
    };
  },
});
</script>

<style scoped>
.avatar-initials {
  font-size: 0.875rem;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.toolbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>
