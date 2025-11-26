<template>
  <div class="p-field">
    <div class="custom-input-group" @click="onSelectClick">
      <span class="custom-input-group-addon">Schedule Types</span>
      <SelectButton
        id="scheduleTypes"
        v-model="rootStore.newSchedule.scheduleTypes"
        :options="scheduleTypes"
        class="w-full"
      />
    </div>
    <small
      v-if="!rootStore.newSchedule.scheduleTypes && attemptedSubmit"
      class="p-error"
    >
      Schedule Type is required.
    </small>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch, ref, nextTick } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useRefStore } from "@/store/RefStore";
import { useMediaStore, type MediaFolder } from "@/store/MediaStore";
import SelectButton from "primevue/selectbutton";

export default defineComponent({
  name: "ScheduleTypeSelect",
  components: { SelectButton },
  props: {
    attemptedSubmit: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const mediaStore = useMediaStore();
    const scheduleTypes = computed(() => rootStore.scheduleTypes);
    // Prevent toggling the currently selected schedule type off by
    // restoring the previous value when the model becomes empty due to a
    // repeated click on the selected button.
    const previous = ref(rootStore.newSchedule.scheduleTypes);
    watch(
      () => rootStore.newSchedule.scheduleTypes,
      (newVal: string, oldVal: string) => {
        // If it became empty (user clicked the already-selected option),
        // restore the previous non-empty value immediately to prevent
        // other watchers from seeing the momentary empty state.
        if ((!newVal || newVal === "") && oldVal) {
          nextTick(() => {
            rootStore.newSchedule.scheduleTypes = previous.value || oldVal;
          });
          return;
        }

        if (newVal && oldVal && newVal !== oldVal) {
          mediaStore.clearSelection();
        }

        previous.value = newVal;
      },
      { flush: "sync" }
    );

    // If the user clicks the SelectButton (even when the value doesn't change),
    // open the media dialog and focus the appropriate folder.
    const onSelectClick = async () => {
      const profile = rootStore.newSchedule.profile;
      const type = rootStore.newSchedule.scheduleTypes;
      if (!profile || !type) return;
      if (type === "System" || profile === "system") {
        refStore.showSystemDialog = true;
        refStore.showMediaDialog = false;
        return;
      }

      // ensure tree data
      try {
        if (!rootStore.treeData) await rootStore.fetchTreeData();
      } catch (_) {
        // ignore
      }

      /* eslint-disable @typescript-eslint/no-explicit-any */
      function findFolder(node: unknown, candidates: string[]): unknown | null {
        if (!node) return null;
        const list = Array.isArray(node) ? (node as any[]) : [node as any];
        for (const n of list) {
          const folders = n?.Folder
            ? Array.isArray(n.Folder)
              ? (n.Folder as any[])
              : [n.Folder]
            : [];
          for (const f of folders) {
            try {
              const serialized = JSON.stringify(f).toLowerCase();
              for (const c of candidates) {
                if (!c) continue;
                if (serialized.includes(c.toLowerCase())) return f;
              }
            } catch (_) {
              // ignore
            }
            const files = f.File
              ? Array.isArray(f.File)
                ? (f.File as any[])
                : [f.File]
              : [];
            if (files.length > 0) return f;
          }
          for (const f of folders) {
            const found = findFolder(f, candidates);
            if (found) return found;
          }
        }
        return null;
      }

      const candidates = [type, profile];
      const folder = findFolder(rootStore.treeData, candidates);
      if (folder) {
        const folderString = JSON.stringify(folder);
        const currentString = mediaStore.focusedFolder
          ? JSON.stringify(mediaStore.focusedFolder)
          : null;
        if (folderString === currentString) {
          mediaStore.focusFolder(null);
          await nextTick();
        }
        mediaStore.focusFolder(folder as MediaFolder);
      } else {
        mediaStore.focusFolder(null);
      }
      mediaStore.clearPreview();
      refStore.showMediaDialog = true;
      refStore.showSystemDialog = false;
    };
    return {
      rootStore,
      scheduleTypes,
      props,
      onSelectClick,
    };
  },
});
</script>

<style scoped>
.font-semibold {
  font-weight: 600;
}
.p-error {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.15rem;
}
.custom-input-group {
  display: flex;
  align-items: stretch;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}
.custom-input-group-addon {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: inherit;
  background-color: transparent;
  font-weight: inherit;
  border-right: 1px solid var(--input-border-color, #d1d5db);
  min-width: 120px;
}
.custom-input-group > :not(.custom-input-group-addon) {
  flex: 1 1 0%;
  min-width: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  display: flex;
}
.custom-input-group .p-selectbutton {
  display: flex;
  flex: 1;
  width: 100%;
}
.custom-input-group .p-selectbutton .p-button-group {
  display: flex;
  flex: 1 1 0%;
  width: 100%;
}
.custom-input-group .p-selectbutton .p-button {
  flex: 1;
  width: 100%;
  border-radius: 0;
  box-sizing: border-box;
}
.custom-input-group .p-selectbutton .p-button:not(:last-child) {
  border-right: 1px solid var(--input-border-color, #d1d5db);
}
.custom-input-group .p-selectbutton .p-button:last-child {
  flex: 1 1 0%;
  width: 100%;
}
.p-button {
  flex: 1;
}
.custom-input-group,
.custom-input-group-addon,
.custom-input-group-content,
.schedule-input,
.p-selectbutton,
.p-inputtext,
.p-calendar,
.p-datepicker,
.p-inputswitch {
  min-height: 52px;
  box-sizing: border-box;
}
</style>
