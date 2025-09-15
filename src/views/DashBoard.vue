<template>
  <div class="dashBoard">
    <!-- Removed <Tag value="New"></Tag> and Save Button as requested -->
    <LayoutPanel
      v-if="refStore.showLayoutPanel"
      @layoutSelected="handleLayoutSelected"
      @updateCurrentLayout="handleUpdateCurrentLayout"
      @openSaveDialog="handleOpenSaveDialog"
      @saveCurrentLayout="handleUpdateCurrentLayout"
    />
    <AGgrid ref="agGridRef" />
    <SystemEditDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, defineAsyncComponent } from "vue";
import { useRefStore } from "@/store/RefStore";
const LayoutPanel = defineAsyncComponent(
  () => import("@/components/LayoutPanel.vue")
);
const AGgrid = defineAsyncComponent(() => import("@/components/AGgrid.vue"));
const SystemEditDialog = defineAsyncComponent(
  () => import("@/components/NewSchedule/SystemEditDialog.vue")
);
import { useRootStore } from "@/store/RootStore";

export default defineComponent({
  name: "DashBoard",
  components: { AGgrid, LayoutPanel, SystemEditDialog },
  setup() {
    const showLayoutPanel = ref(false);
    type AGGridExposed = {
      openSaveDialog?: () => void;
      onLayoutSelected?: (layout: unknown) => void;
      updateCurrentLayout?: () => void;
    };
    const agGridRef = ref<AGGridExposed | null>(null);
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const visible = ref(false);
    onMounted(async () => {
      await rootStore.fetchSchedules();
      await rootStore.fetchScheduleTagsGroups();
    });

    const handleOpenSaveDialog = () => {
      if (process.env.NODE_ENV !== "production") {
        // dev-only
        // eslint-disable-next-line no-console
        console.log("Dashboard: handleOpenSaveDialog received");
      }
      if (agGridRef.value?.openSaveDialog) {
        agGridRef.value.openSaveDialog();
      } else {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("Dashboard: AGgrid openSaveDialog is not available");
        }
      }
    };

    const handleLayoutSelected = (layout: unknown) => {
      if (agGridRef.value?.onLayoutSelected) {
        agGridRef.value.onLayoutSelected(layout);
      }
    };

    const handleUpdateCurrentLayout = () => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("handleUpdateCurrentLayout called", agGridRef.value);
      }
      if (agGridRef.value?.updateCurrentLayout) {
        agGridRef.value.updateCurrentLayout();
      } else {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn(
            "agGridRef.value or updateCurrentLayout is not available"
          );
        }
      }
    };

    return {
      showLayoutPanel,
      agGridRef,
      handleLayoutSelected,
      handleUpdateCurrentLayout,
      handleOpenSaveDialog,
      visible,
      rootStore,
      refStore,
    };
  },
});
</script>
