<template>
  <Dialog
    v-model:visible="refStore.showSystemEditDialog"
    modal
    header="Edit System"
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
    <SystemEdit
      v-if="canRenderEdit"
      v-model="localModelProxy"
      :profile="safeProfile"
      @save="onSave"
      @cancel="onCancel"
    />
  </Dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import { useRefStore } from "@/store/RefStore";
import { useRootStore } from "@/store/RootStore";
import { useSystemStore } from "@/store/SystemStore";
import { useNotificationStore } from "@/store/NotificationStore";
import type { SystemFormModel, Leg, Item } from "@/types";
import Dialog from "primevue/dialog";
import SystemEdit from "@/components/NewSchedule/SystemEdit.vue";

export default defineComponent({
  name: "SystemEditDialog",
  components: { Dialog, SystemEdit },
  setup() {
    const refStore = useRefStore();
    const rootStore = useRootStore();
    const systemStore = useSystemStore();
    const notificationStore = useNotificationStore();

    const localModel = ref<SystemFormModel | null>(null);

    const canRenderEdit = computed(() => {
      return !!(
        refStore.systemEditModel &&
        refStore.systemEditContext &&
        localModel.value
      );
    });

    const safeProfile = computed(
      () => refStore.systemEditContext?.profile || ""
    );

    const localModelProxy = computed<SystemFormModel>({
      get() {
        return localModel.value as SystemFormModel;
      },
      set(v: SystemFormModel) {
        localModel.value = v;
      },
    });

    watch(
      () => refStore.systemEditModel,
      (m) => {
        localModel.value = m ? JSON.parse(JSON.stringify(m)) : null;
      },
      { immediate: true, deep: true }
    );

    function onDialogVisibleChange(visible: boolean) {
      if (!visible) {
        refStore.closeSystemEdit();
      }
    }

    function buildTransformedData(model: SystemFormModel, profile: string) {
      return {
        location: model.location || "",
        text: model.title,
        width: 1920,
        height: 1080,
        bettype: model.betType,
        rows: (model.legs || []).map((leg: Leg, legIndex: number) => ({
          horses: leg.isAllChecked ? [] : leg.checked.map(Number),
          text: leg.isAllChecked
            ? profile === "ASR"
              ? "All Horses"
              : "Alla Hästar"
            : leg.checked.length === 1
            ? getHorseName(model, leg.checked[0], legIndex, profile)
            : leg.textInput || "",
        })),
      };
    }

    function getHorseName(
      model: SystemFormModel,
      horseNumber: string | null,
      legIndex: number,
      profile: string
    ) {
      const leg = model.legs[legIndex];
      if (leg.isAllChecked || horseNumber === null) {
        return profile === "ASR" ? "All Horses" : "Alla Hästar";
      }
      const horse = leg.starts.find((start) => start.hnr === horseNumber);
      return horse ? horse.hName : "";
    }

    async function onSave(model: SystemFormModel) {
      const ctx = refStore.systemEditContext;
      if (!ctx) {
        notificationStore.showToast({
          severity: "error",
          summary: "System Edit",
          detail:
            "Missing edit context. Please reopen the editor and try again.",
          life: 3000,
        });
        return;
      }
      // 1) Create PNG (regenerate)
      const payload = buildTransformedData(model, ctx.profile);
      await systemStore.createPNG(payload);
      // 2) Update the matching schedule's metaData/path/location
      const { id, profile } = ctx;
      const schedule = rootStore.schedules.find(
        (s: Item) => s.id === id && s.profile === profile
      );
      if (schedule) {
        // preserve rest of schedule fields; update only metaData
        const updated: Item & { metaData?: Record<string, unknown> } = {
          ...schedule,
        };
        updated.metaData = {
          ...(schedule.metaData || {}),
          ...model,
        } as Record<string, unknown>;
        await rootStore.upsertSchedule(updated);
      }
      refStore.closeSystemEdit();
    }

    function onCancel() {
      refStore.closeSystemEdit();
    }

    return {
      refStore,
      rootStore,
      systemStore,
      localModel,
      notificationStore,
      safeProfile,
      localModelProxy,
      canRenderEdit,
      onSave,
      onCancel,
      onDialogVisibleChange,
    };
  },
});
</script>

<style scoped></style>
