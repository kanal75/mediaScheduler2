<template>
  <div class="app-root">
    <div class="app-main">
      <ToolBar />
      <router-view />
      <Toast position="top-center" group="tc" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, onMounted } from "vue";
import Toast from "primevue/toast";
import ToolBar from "@/components/ToolBar.vue";
import { useRefStore } from "@/store/RefStore";
import { useAccountStore } from "@/store/AccountStore";
import { useToast } from "primevue/usetoast";
import { storeToRefs } from "pinia";
import { useNotificationStore } from "@/store/NotificationStore";

export default defineComponent({
  name: "App",
  components: { ToolBar, Toast },
  setup() {
    const refStore = useRefStore();
    const accountStore = useAccountStore();
    const toast = useToast();
    const notificationStore = useNotificationStore();
    const { toast: toastMessage } = storeToRefs(notificationStore);
    onMounted(() => {
      // Restore current layout selection
      refStore.loadFromStorage?.();
      document.documentElement.classList.toggle(
        "app-dark",
        refStore.isDarkMode
      );
    });
    watch(
      () => accountStore.account?.settings.isDarkMode,
      (isDark) => {
        if (typeof isDark === "boolean") {
          refStore.setDarkMode(isDark);
          // Ensure .app-dark class is updated when theme changes after login/profile load
          document.documentElement.classList.toggle("app-dark", isDark);
        }
      },
      { immediate: true }
    );
    watch(toastMessage, (val) => {
      if (val) {
        toast.add(val);
        notificationStore.clearToast();
      }
    });
    return { refStore };
  },
});
</script>
