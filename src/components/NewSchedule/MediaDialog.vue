<template>
  <div class="card flex justify-center">
    <Dialog
      v-model:visible="refStore.showMediaDialog"
      header="Add New Schedule"
      :style="{ width: '80vw' }"
      contentStyle="max-height: 80vh; overflow-y: auto;"
      :baseZIndex="10000"
      :closeOnEscape="true"
      :dismissableMask="true"
      :showHeader="true"
      maximizable
      @update:visible="onDialogVisibleChange"
    >
      <Splitter style="height: 100%; padding: 2%" :gutterSize="5">
        <!-- Left Panel: Tree (MediaTree) -->
        <SplitterPanel class="flex items-center justify-center" :size="30">
          <MediaTree />
        </SplitterPanel>
        <!-- Middle Panel: Gallery (MediaGallery) -->
        <SplitterPanel class="p-0" :size="50">
          <MediaGallery />
        </SplitterPanel>
        <!-- Right Panel: Advanced Schedule Card (NewScheduleCard) -->
        <SplitterPanel class="p-0" :size="20">
          <NewScheduleCard />
        </SplitterPanel>
      </Splitter>

      <!-- Dialog Footer with Add Button -->
      <template #footer>
        <div class="flex items-center w-full">
          <div class="flex gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              class="p-button-info"
              @click="closeDialog"
            />
            <Button
              label="Reset"
              icon="pi pi-refresh"
              class="p-button-secondary"
              @click="resetMedia"
            />
            <Button
              label="Refresh Tree"
              icon="pi pi-sync"
              class="p-button-warning"
              @click="refreshTree"
            />
          </div>
          <div class="flex-1"></div>
          <div class="flex justify-end">
            <Button
              label="Add Media"
              icon="pi pi-plus"
              :disabled="!isFileSelected"
              @click="addToMetaData"
              class="p-button-primary"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRefStore } from "@/store/RefStore";
import { useRootStore } from "@/store/RootStore";
import MediaTree from "@/components/NewSchedule/MediaTree.vue";
import MediaGallery from "@/components/NewSchedule/MediaGallery.vue";
import NewScheduleCard from "@/components/NewSchedule/NewScheduleCard.vue";

export default defineComponent({
  name: "MediaDialog",
  components: {
    MediaTree,
    MediaGallery,
    NewScheduleCard,
  },
  setup() {
    const refStore = useRefStore();
    const rootStore = useRootStore();

    const isFileSelected = computed(() => !!rootStore.selectedFile);

    const addToMetaData = () => {
      if (rootStore.selectedFile) {
        rootStore.newSchedule.metaData = rootStore.selectedFile.Data || {};
        refStore.showMediaDialog = false;
      }
    };

    const closeDialog = () => {
      refStore.showMediaDialog = false;
      rootStore.resetNewSchedule();
      rootStore.selectedFile = null;
    };

    const resetMedia = () => {
      rootStore.selectedFile = null;
    };

    const refreshTree = async () => {
      rootStore.treeData = null;
      await rootStore.fetchTreeData();
    };

    const onDialogClose = () => {
      refStore.showMediaDialog = false;
      rootStore.resetNewSchedule();
    };

    const onDialogVisibleChange = (visible: boolean) => {
      if (!visible) {
        refStore.showMediaDialog = false;
        rootStore.resetNewSchedule();
      }
    };

    return {
      refStore,
      rootStore,
      isFileSelected,
      addToMetaData,
      closeDialog,
      resetMedia,
      onDialogClose,
      onDialogVisibleChange,
      refreshTree,
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
.add-media-absolute {
  /* Remove absolute positioning */
}
</style>
