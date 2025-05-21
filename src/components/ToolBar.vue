<template>
  <v-app-bar :elevation="2">
    <template v-slot:prepend>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
    </template>
    <v-app-bar-title>Media Scheduler 2o</v-app-bar-title>
    <v-spacer></v-spacer>
    <v-btn
      v-tooltip:bottom-end="'New Schedule'"
      icon
      @click="showNewScheduleDialog"
      :disabled="!accountStore.account"
    >
      <v-icon>mdi-calendar-plus</v-icon>
    </v-btn>
    <v-btn
      v-tooltip:bottom-end="'Settings'"
      icon
      @click="refStore.toggleSettingsPanel"
      :disabled="!accountStore.account"
    >
      <v-icon>mdi-cog</v-icon>
    </v-btn>
    <!-- Layouts button -->
    <v-btn
      v-tooltip:bottom="'Layouts'"
      icon
      @click="refStore.toggleLayoutPanel"
      :disabled="!accountStore.account"
    >
      <v-icon>mdi-view-quilt</v-icon>
    </v-btn>
    <!-- Theme toggle button -->
    <v-btn v-tooltip:bottom="'Theme'" icon @click="toggleTheme">
      <v-icon
        :icon="refStore.isDarkMode ? 'mdi-weather-night' : 'mdi-weather-sunny'"
      ></v-icon>
    </v-btn>
    <!-- Profile button -->
    <v-btn
      v-tooltip:bottom="'Profile'"
      icon
      @click="refStore.toggleAccountPanel"
    >
      <template v-if="account">
        <v-avatar size="32" color="green">
          <span class="avatar-initials">{{ initials }}</span>
        </v-avatar>
      </template>
      <template v-else>
        <v-icon>mdi-account</v-icon>
      </template>
    </v-btn>
  </v-app-bar>
  <SettingsPanel />
  <LayoutPanel />
  <AccountPanel />
  <NewScheduleDialog />
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useTheme } from "vuetify";
import { useRefStore } from "@/store/RefStore";
import { useRootStore } from "@/store/RootStore";
import { useAccountStore } from "@/store/AccountStore";
import SettingsPanel from "./SettingsPanel.vue";
import LayoutPanel from "./LayoutPanel.vue";
import AccountPanel from "./AccountPanel.vue";
import NewScheduleDialog from "./NewSchedule/NewScheduleDialog.vue";

export default defineComponent({
  name: "ToolBar",
  components: { AccountPanel, LayoutPanel, SettingsPanel, NewScheduleDialog },
  setup() {
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const accountStore = useAccountStore();
    const vuetifyTheme = useTheme();
    refStore.setThemeInstance(vuetifyTheme);

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
</style>
