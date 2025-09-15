<template>
  <div class="card flex justify-center">
    <Dialog
      v-model:visible="refStore.showNewScheduleDialog"
      header="Add New Schedule"
      :style="{ width: '80vw' }"
      contentStyle="max-height: 80vh; overflow-y: auto;"
      :baseZIndex="10000"
      :closeOnEscape="true"
      :dismissableMask="true"
      :showHeader="true"
      maximizable
      modal
      @update:visible="onDialogVisibleChange"
    >
      <Splitter style="height: 100%; padding: 2%" :gutterSize="5">
        <!-- Left Panel: align form top‐left, fill height -->
        <SplitterPanel
          class="flex flex-col items-start justify-start h-full"
          :size="65"
        >
          <NewScheduleForm @validity-change="onFormValidityChange" />
        </SplitterPanel>

        <!-- Right Panel: fill height -->
        <SplitterPanel class="p-0 h-full" :size="35">
          <NewScheduleCard />
        </SplitterPanel>
      </Splitter>
    </Dialog>
    <MediaDialog v-if="refStore.showMediaDialog" />
    <SystemDialog />
    <SystemEditDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, ref } from "vue";
import { useRefStore } from "@/store/RefStore";
import { useRootStore } from "@/store/RootStore";
import NewScheduleForm from "@/components/NewSchedule/NewScheduleForm.vue";
import NewScheduleCard from "@/components/NewSchedule/NewScheduleCard.vue";
import MediaDialog from "@/components/NewSchedule/MediaDialog.vue";
import SystemDialog from "@/components/NewSchedule/SystemDialog.vue";
import SystemEditDialog from "@/components/NewSchedule/SystemEditDialog.vue";
import Dialog from "primevue/dialog";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";

export default defineComponent({
  name: "NewScheduleDialog",
  components: {
    NewScheduleForm,
    NewScheduleCard,
    MediaDialog,
    SystemDialog,
    SystemEditDialog,
    Dialog,
    Splitter,
    SplitterPanel,
  },
  setup() {
    const refStore = useRefStore();
    const rootStore = useRootStore();
    const isFormValid = ref(false);

    // Watch for changes in newSchedule.profile and newSchedule.scheduleTypes.
    // When both are non-empty, set showMediaDialog to true.
    watch(
      () => [
        rootStore.newSchedule.profile,
        rootStore.newSchedule.scheduleTypes,
      ],
      async ([profile, scheduleTypes]) => {
        if (profile !== "" && scheduleTypes !== "") {
          if (profile !== "system" && scheduleTypes !== "System") {
            // Reset dialog state before opening
            rootStore.setSelectedFile(null);
            rootStore.setSelectedFolder(null);
            refStore.showMediaDialog = true;
            refStore.showSystemDialog = false;
          } else if (scheduleTypes === "System") {
            refStore.showMediaDialog = false;
            refStore.showSystemDialog = true;
          } else {
            refStore.showMediaDialog = false;
            refStore.showSystemDialog = false;
          }
        } else {
          refStore.showMediaDialog = false;
          refStore.showSystemDialog = false;
        }
      }
    );
    // Handle dialog visibility change
    const onDialogVisibleChange = (visible: boolean) => {
      if (!visible) {
        refStore.showNewScheduleDialog = false;
        rootStore.resetNewSchedule();
      }
    };

    // Add a handler to receive validity from the form
    const onFormValidityChange = (valid: boolean) => {
      isFormValid.value = valid;
    };

    return {
      refStore,
      onDialogVisibleChange,
      isFormValid,
      onFormValidityChange,
    };
  },
});
</script>

<style scoped>
.h-full {
  height: 100%;
}
.w-full {
  width: 100%;
}
</style>
