<template>
  <div class="dashBoard">
    <!-- Removed <Tag value="New"></Tag> and Save Button as requested -->
    <layout-panel
      v-model="showLayoutPanel"
      @layoutSelected="handleLayoutSelected"
      @updateCurrentLayout="handleUpdateCurrentLayout"
      @openSaveDialog="handleOpenSaveDialog"
    />
    <AGgrid ref="agGridRef" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import AGgrid from "@/components/AGgrid.vue";
import LayoutPanel from "@/components/LayoutPanel.vue";
import { useRootStore } from "@/store/RootStore";

export default defineComponent({
  name: "DashBoard",
  components: { AGgrid, LayoutPanel },
  setup() {
    const showLayoutPanel = ref(false);
    const agGridRef = ref<any>(null);
    const rootStore = useRootStore();
    const visible = ref(false);
    onMounted(async () => {
      await rootStore.fetchSchedules();
      await rootStore.fetchScheduleTagsGroups();
    });

    const handleOpenSaveDialog = () => {
      console.log("Dashboard: handleOpenSaveDialog received");
      if (agGridRef.value && agGridRef.value.openSaveDialog) {
        agGridRef.value.openSaveDialog();
      } else {
        console.log("Dashboard: AGgrid openSaveDialog is not available");
      }
    };

    const handleLayoutSelected = (layout: any) => {
      if (agGridRef.value && agGridRef.value.onLayoutSelected) {
        agGridRef.value.onLayoutSelected(layout);
      }
    };

    const handleUpdateCurrentLayout = () => {
      console.log("handleUpdateCurrentLayout called", agGridRef.value);
      if (agGridRef.value && agGridRef.value.updateCurrentLayout) {
        agGridRef.value.updateCurrentLayout();
      } else {
        console.warn("agGridRef.value or updateCurrentLayout is not available");
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
    };
  },
});
</script>
