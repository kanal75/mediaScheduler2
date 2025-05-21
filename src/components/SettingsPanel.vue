<template>
  <Drawer
    v-model:visible="refStore.showSettingsPanel"
    position="right"
    class="settings-drawer"
    :style="{ width: '400px' }"
  >
    <template #header>
      <span class="text-h6">Account Settings</span>
    </template>
    <Divider />
    <Card class="pa-4 flex flex-column gap-2">
      <template #content>
        <div v-if="!account">
          <p>You must be logged in to adjust settings.</p>
        </div>
        <div v-else>
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

export default defineComponent({
  name: "SettingsPanel",
  setup() {
    const refStore = useRefStore();
    const accountStore = useAccountStore();
    const account = computed(() => accountStore.account);
    const isFirstSettingsUpdate = ref(true);
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
          accountStore
            .putAccount(account.value)
            .catch((err) => console.error("Error updating account:", err));
        }
      },
      { deep: true }
    );
    return {
      refStore,
      account,
      generalSettings,
    };
  },
});
</script>

<style scoped>
.settings-drawer {
  z-index: 1300;
}
.text-h6 {
  font-size: 1.25rem;
  font-weight: 600;
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
