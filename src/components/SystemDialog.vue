<template>
  <Dialog
    v-model:visible="refStore.showSystemDialog"
    modal
    header="Create System"
    :closable="true"
    :style="{ width: '60vw' }"
    contentStyle="max-height: 80vh; overflow-y: auto;"
    :baseZIndex="10000"
    :closeOnEscape="true"
    :dismissableMask="true"
    :showHeader="true"
    maximizable
    @update:visible="onDialogVisibleChange"
  >
    <SystemForm />
  </Dialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useRefStore } from "@/store/RefStore";
import { useSystemStore } from "@/store/SystemStore";
import SystemForm from "@/components/SystemForm.vue";

export default defineComponent({
  name: "SystemDialog",
  components: { SystemForm },
  setup() {
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const systemStore = useSystemStore();
    const onDialogVisibleChange = (visible: boolean) => {
      if (!visible) {
        refStore.showSystemDialog = false;
        systemStore.resetForm();
        rootStore.resetNewSchedule();
      }
    };
    return {
      rootStore,
      refStore,
      systemStore,
      onDialogVisibleChange,
    };
  },
});
</script>
