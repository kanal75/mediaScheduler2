<template>
  <div class="card flex justify-center">
    <Dialog
      v-model:visible="internalVisible"
      :header="rootStore.treeData === null ? 'Loading media…' : 'Select Media'"
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
import {
  useMediaStore,
  type MediaFile,
  type MediaFolder,
} from "@/store/MediaStore";
import MediaTree from "@/components/NewSchedule/MediaTree.vue";
import MediaGallery from "@/components/NewSchedule/MediaGallery.vue";
import Dialog from "primevue/dialog";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import Button from "primevue/button";
import Icon from "@/components/icons/Icon.vue";

export default defineComponent({
  name: "MediaDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:visible", "file-selected", "cancelled"],
  components: {
    MediaTree,
    MediaGallery,
    Dialog,
    Splitter,
    SplitterPanel,
    Button,
    Icon,
  },
  setup(props, { emit }) {
    const refStore = useRefStore();
    const rootStore = useRootStore();
    const mediaStore = useMediaStore();

    const internalVisible = computed({
      get: () => props.visible,
      set: (v: boolean) => emit("update:visible", v),
    });

    const isFileSelected = computed(() => !!mediaStore.selectedFile);

    const addToMetaData = () => {
      const file = mediaStore.selectedFile as MediaFile | null;
      if (!file) return;
      rootStore.newSchedule.metaData =
        (file.Data as typeof rootStore.newSchedule.metaData | undefined) ||
        rootStore.newSchedule.metaData;
      // User selected a file — clear dismissed state and close dialog.
      refStore.mediaDialogDismissed = false;
      emit("file-selected", file);
      emit("update:visible", false);
    };

    const closeDialog = () => {
      // User explicitly closed/cancelled the media dialog — remember that so
      // we don't auto-reopen it until the user changes profile/type.
      emit("update:visible", false);
      refStore.mediaDialogDismissed = true;
      emit("cancelled");
      // Keep the newSchedule model as-is (don't reset everything) so the
      // user's form entries (profile/type) remain. But clear selectedFile so
      // the gallery doesn't show a single-file view.
      mediaStore.clearSelection();
    };

    const resetMedia = () => {
      mediaStore.clearSelection();
    };

    const refreshTree = async () => {
      rootStore.treeData = null;
      await rootStore.fetchTreeData();
    };

    const onDialogClose = () => {
      emit("update:visible", false);
      refStore.mediaDialogDismissed = true;
      // Keep the schedule model intact; user chose to close.
      mediaStore.clearPreview();
    };

    const onDialogVisibleChange = (visible: boolean) => {
      if (!visible) {
        refStore.showMediaDialog = false;
        refStore.mediaDialogDismissed = true;
        mediaStore.clearPreview();
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
      () => props.visible,
      async (open) => {
        if (open) {
          mediaStore.clearPreview();
          if (!rootStore.treeData) {
            await rootStore.fetchTreeData();
          }
          if (!mediaStore.focusedFolder && rootStore.treeData) {
            const first = findFirstFolderWithFiles(rootStore.treeData);
            if (first) mediaStore.focusFolder(first as MediaFolder);
          }
        } else {
          mediaStore.clearPreview();
        }
      }
    );

    return {
      refStore,
      rootStore,
      internalVisible,
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
