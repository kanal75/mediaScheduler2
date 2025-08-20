<template>
  <Drawer
    v-model:visible="refStore.showSettingsPanel"
    position="right"
    class="settings-drawer"
    :style="{ width: '400px' }"
  >
    <template #header>
      <div class="header-row">
        <span class="text-h6">Account Settings</span>
        <span v-if="isSaving" class="saving">Saving…</span>
      </div>
    </template>
    <Divider />
    <Card class="pa-4 flex flex-column gap-2">
      <template #content>
        <div v-if="!account">
          <p>You must be logged in to adjust settings.</p>
        </div>
        <div v-else>
          <Panel header="Appearance" toggleable :collapsed="false" class="mb-3">
            <div class="general-list">
              <div class="setting-row">
                <span class="setting-text">Dark Mode</span>
                <InputSwitch v-model="account.settings.isDarkMode" />
              </div>
            </div>
          </Panel>
          <Panel header="General" toggleable :collapsed="false" class="mb-3">
            <div class="general-list">
              <div
                class="setting-row"
                v-for="setting in generalSettings"
                :key="setting.key"
              >
                <span class="setting-text">{{ setting.label }}</span>
                <InputSwitch
                  v-model="(account.settings.general as Record<string, boolean>)[setting.key]"
                />
              </div>
            </div>
          </Panel>
        </div>
      </template>
    </Card>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, computed, watch, ref } from "vue";
import { useRefStore } from "@/store/RefStore";
import { useAccountStore } from "@/store/AccountStore";
import Drawer from "primevue/drawer";
import Divider from "primevue/divider";
import Card from "primevue/card";
import Panel from "primevue/panel";
import InputSwitch from "primevue/inputswitch";

export default defineComponent({
  name: "SettingsPanel",
  components: { Drawer, Divider, Card, Panel, InputSwitch },
  setup() {
    const refStore = useRefStore();
    const accountStore = useAccountStore();
    const account = computed(() => accountStore.account);
    const isFirstSettingsUpdate = ref(true);
    const isSaving = ref(false);
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    // General settings config for rendering
    const generalSettings = [
      { key: "sideBar", label: "Columns Tool Panel" },
      { key: "columnHoverHighlight", label: "Column Hover" },
      { key: "pagination", label: "Pagination" },
      { key: "resizableColumns", label: "Column Resizing" },
      { key: "sorting", label: "Sorting" },
      { key: "filter", label: "Filter" },
      { key: "floatingFilter", label: "Floating Filter" },
    ];
    // Watch for changes in settings only after initial load
    watch(
      () => account.value?.settings,
      (newSettings) => {
        if (isFirstSettingsUpdate.value) {
          isFirstSettingsUpdate.value = false;
          return;
        }
        if (newSettings && account.value) {
          if (saveTimer) clearTimeout(saveTimer);
          isSaving.value = true;
          saveTimer = setTimeout(async () => {
            try {
              const acc = account.value;
              if (acc) {
                await accountStore.putAccount(acc);
              }
            } catch (err) {
              /* ignore update errors; UI shows saving state */
            } finally {
              isSaving.value = false;
            }
          }, 300);
        }
      },
      { deep: true }
    );

    // Keep UI theme in sync when dark mode changes here
    watch(
      () => account.value?.settings.isDarkMode,
      (val) => {
        if (typeof val === "boolean") {
          refStore.setDarkMode(val);
          document.documentElement.classList.toggle("app-dark", val);
        }
      }
    );
    return {
      refStore,
      account,
      generalSettings,
      isSaving,
    };
  },
});
</script>

<style scoped>
.settings-drawer {
  z-index: 1300;
}
.header-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.text-h6 {
  font-size: 1.25rem;
  font-weight: 600;
}
.saving {
  font-size: 0.95rem;
  color: #888;
}
.general-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
}
.setting-text {
  font-size: 1.1rem;
}
</style>
