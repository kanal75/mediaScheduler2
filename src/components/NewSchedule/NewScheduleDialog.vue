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
      <Splitter :gutterSize="5" style="height: 100%; width: 100%">
        <SplitterPanel :size="65" class="new-schedule-main">
          <NewScheduleForm @validity-change="onFormValidityChange" />
          <!-- SpeechInput beta block commented out for this deployment
          <div class="beta-frame mt-4 beta-align">
            <div class="beta-frame-header">
              <span class="beta-label">Beta</span>
              <span class="beta-title">Voice schedule</span>
            </div>
            <div class="beta-frame-body">
              <SpeechInput @schedule-from-speech="onScheduleFromSpeech" />
            </div>
          </div>
          -->
        </SplitterPanel>
        <SplitterPanel :size="35" class="new-schedule-preview">
          <NewScheduleCard />
        </SplitterPanel>
      </Splitter>
    </Dialog>
    <MediaDialog
      v-model:visible="refStore.showMediaDialog"
      @file-selected="onMediaFileSelected"
      @cancelled="onMediaDialogCancelled"
    />
    <SystemDialog />
    <SystemEditDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
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

    // No async work here; dialog now opens immediately and
    // media loading happens inside MediaDialog/MediaGallery.
    // Handle dialog visibility change
    const onDialogVisibleChange = (visible: boolean) => {
      if (!visible) {
        refStore.showNewScheduleDialog = false;
        rootStore.resetNewSchedule();
      }
    };

    const onMediaFileSelected = () => {
      // MediaDialog will emit a selected file via MediaStore; nothing else to do here for now.
      refStore.showMediaDialog = false;
    };

    const onMediaDialogCancelled = () => {
      refStore.showMediaDialog = false;
      refStore.mediaDialogDismissed = true;
    };

    const onScheduleFromSpeech = (payload: unknown) => {
      // TODO: Map payload structure from /oalink to NewSchedule
      // For now, we just replace newSchedule raw if it matches shape.
      if (payload && typeof payload === "object") {
        try {
          // This cast assumes the JSON has same shape as NewSchedule
          // or at least overlapping fields used by the app.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = payload as any;
          rootStore.newSchedule = {
            ...rootStore.newSchedule,
            ...data,
          };
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Failed to apply speech schedule payload", e);
        }
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
      onMediaFileSelected,
      onMediaDialogCancelled,
      onScheduleFromSpeech,
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
.new-schedule-main {
  min-width: 0;
}

.new-schedule-preview {
  min-width: 0;
}

.beta-frame {
  border-radius: 0.75rem;
  border: 1px solid #ffffff;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem 1rem 1rem;
}

.beta-align {
  margin-left: 1.5rem;
  margin-right: 1.5rem;
}

.beta-frame-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.beta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--primary-color);
  color: var(--primary-color-text);
}

.beta-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.beta-frame-body {
  margin-top: 0.25rem;
}

@media (max-width: 960px) {
  .new-schedule-preview {
    margin-top: 1rem;
  }
}
</style>
