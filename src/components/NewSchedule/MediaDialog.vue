<template>
  <div class="card flex justify-center">
    <Dialog
      v-model:visible="refStore.showMediaDialog"
      header="Add New Schedule"
      :style="{ width: '80vw' }"
      contentStyle="height: 80vh; overflow: hidden;"
      :baseZIndex="10000"
      :closeOnEscape="true"
      :dismissableMask="true"
      :showHeader="true"
      maximizable
      @update:visible="onDialogVisibleChange"
    >
      <Splitter style="height: 100%" :gutterSize="5">
        <!-- Left Panel: Tree (MediaTree) -->
        <SplitterPanel
          class="flex items-center justify-center h-full"
          :size="30"
        >
          <MediaTree />
        </SplitterPanel>
        <!-- Middle Panel: Gallery (MediaGallery) -->
        <SplitterPanel class="p-0 h-full" :size="70">
          <MediaGallery />
        </SplitterPanel>
      </Splitter>

      <!-- Dialog Footer with Add Button -->
      <template #footer>
        <div class="flex items-center w-full">
          <div class="flex gap-2">
            <Button label="Cancel" class="p-button-info" @click="closeDialog">
              <template #icon>
                <Icon name="times" />
              </template>
            </Button>
            <Button
              label="Reset"
              class="p-button-secondary"
              @click="resetMedia"
            >
              <template #icon>
                <Icon name="refresh" />
              </template>
            </Button>
            <Button
              label="Refresh Tree"
              class="p-button-warning"
              @click="refreshTree"
            >
              <template #icon>
                <Icon name="sync" />
              </template>
            </Button>
          </div>
          <div class="flex-1"></div>
          <div class="flex justify-end">
            <span class="add-media-instruction"
              >Click an image to add media</span
            >
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from "vue";
import { useRefStore } from "@/store/RefStore";
import { useRootStore } from "@/store/RootStore";
import MediaTree from "@/components/NewSchedule/MediaTree.vue";
import MediaGallery from "@/components/NewSchedule/MediaGallery.vue";
import Dialog from "primevue/dialog";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import Button from "primevue/button";
import Icon from "@/components/icons/Icon.vue";

export default defineComponent({
  name: "MediaDialog",
  components: {
    MediaTree,
    MediaGallery,
    Dialog,
    Splitter,
    SplitterPanel,
    Button,
    Icon,
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

    // Ensure a default folder with files is selected when dialog opens
    function findFirstFolderWithFiles(node: unknown): unknown | null {
      if (!node) return null;
      const nodes = Array.isArray(node) ? node : [node];
      for (const n of nodes) {
        const folders = n.Folder
          ? Array.isArray(n.Folder)
            ? n.Folder
            : [n.Folder]
          : [];
        // Prefer a folder that already has files
        for (const f of folders) {
          const files = f.File
            ? Array.isArray(f.File)
              ? f.File
              : [f.File]
            : [];
          if (files.length > 0) return f;
        }
        // Otherwise, recurse deeper
        for (const f of folders) {
          const found = findFirstFolderWithFiles(f);
          if (found) return found;
        }
      }
      return null;
    }

    watch(
      () => refStore.showMediaDialog,
      async (open) => {
        if (open) {
          if (!rootStore.treeData) {
            await rootStore.fetchTreeData();
          }
          if (!rootStore.selectedFolder && rootStore.treeData) {
            const first = findFirstFolderWithFiles(rootStore.treeData);
            if (first) rootStore.setSelectedFolder(first);
          }
        }
      }
    );

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
.add-media-instruction {
  color: #1976d2;
  font-weight: 500;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5em 1em;
  border-radius: 4px;
  background: rgba(25, 118, 210, 0.08);
}
</style>
