<template>
  <div class="button-container" :class="{ disabled: !isLoggedIn }">
    <!-- Only render buttons if params.data exists -->
    <template v-if="params.data">
      <!-- Edit (system) button -->
      <Button
        v-if="isSystemRow"
        outlined
        class="p-button-sm action-btn edit-btn"
        @click="onEditSystem"
        :disabled="!isLoggedIn"
        aria-label="Edit System"
      >
        <Icon name="pencil" class="icon" />
      </Button>
      <!-- Delete button -->
      <Button
        outlined
        class="p-button-sm action-btn delete-btn"
        @click="onDelete"
        :disabled="!isLoggedIn"
        severity="danger"
        aria-label="Delete"
      >
        <Icon name="trash" class="icon" />
      </Button>

      <!-- Copy button -->
      <Button
        outlined
        class="p-button-sm action-btn copy-btn"
        @click="onCopy"
        :disabled="!isLoggedIn"
        aria-label="Copy"
      >
        <Icon name="copy" class="icon" />
      </Button>

      <!-- Pause/Play button -->
      <Button
        outlined
        class="p-button-sm action-btn play-btn"
        v-if="params.data.status === 'Paused'"
        @click="onResume"
        :disabled="!isLoggedIn"
        aria-label="Resume"
      >
        <Icon name="play" class="icon" />
      </Button>
      <Button
        outlined
        class="p-button-sm action-btn pause-btn"
        v-else
        @click="onPause"
        :disabled="!isLoggedIn"
        aria-label="Pause"
      >
        <Icon name="pause" class="icon" />
      </Button>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import Icon from "@/components/icons/Icon.vue";
import { useRootStore } from "@/store/RootStore";
import { useNotificationStore } from "@/store/NotificationStore";
import { useAccountStore } from "@/store/AccountStore";
import { useRefStore } from "@/store/RefStore";
import type { Leg } from "@/types";

export default defineComponent({
  name: "ActionsCellRenderer",
  components: { Icon },
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const rootStore = useRootStore();
    const accountStore = useAccountStore();
    const notificationStore = useNotificationStore();
    const refStore = useRefStore();

    const isLoggedIn = computed(() => !!accountStore.account);
    const isSystemRow = computed(
      () => props.params?.data?.scheduleTypes === "System"
    );

    const onDelete = async () => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        props.params.api.applyTransaction({ remove: [props.params.data] });
        await rootStore.deleteSchedule(props.params.data);
        notificationStore.showToast({
          severity: "success",
          summary: "Delete",
          detail: "Item deleted successfully.",
          life: 3000,
        });
      } else {
        notificationStore.showToast({
          severity: "info",
          summary: "Delete",
          detail: "Delete cancelled.",
          life: 2000,
        });
      }
    };

    const onCopy = async () => {
      const currentRowIndex = props.params.node.rowIndex;
      const newSchedule = { ...props.params.data, id: Date.now().toString() };

      // Update the store immutably
      rootStore.schedules = [
        ...rootStore.schedules.slice(0, currentRowIndex + 1),
        newSchedule,
        ...rootStore.schedules.slice(currentRowIndex + 1),
      ];

      props.params.api.applyTransaction({
        add: [newSchedule],
        addIndex: currentRowIndex + 1,
      });

      await rootStore.upsertSchedule(newSchedule);

      notificationStore.showToast({
        severity: "success",
        summary: "Copy",
        detail: "Row copied successfully.",
        life: 3000,
      });
    };

    const onEditSystem = () => {
      const row = props.params.data || {};
      const meta = (row.metaData || {}) as Record<string, unknown>;
      const legs = Array.isArray(meta.legs)
        ? (meta.legs as unknown[]).map((l) => l as Leg)
        : ([] as Leg[]);
      const model = {
        title: String(meta.title || ""),
        date: String(meta.date || ""),
        track: String(meta.track || ""),
        betType: String(meta.betType || ""),
        legs,
        path: String((meta.path as unknown) || ""),
        location: String((meta.location as unknown) || ""),
      };
      refStore.openSystemEdit(model, {
        id: row.id,
        profile: row.profile,
        scheduleTypes: row.scheduleTypes,
      });
    };

    // Pause the schedule by setting its status to 'Paused'
    const onPause = async () => {
      const schedule = props.params.data;
      schedule.status = "Paused";
      await rootStore.upsertSchedule(schedule);
      notificationStore.showToast({
        severity: "info",
        summary: "Pause",
        detail: "Schedule paused.",
        life: 2000,
      });
    };

    // Resume the schedule by clearing 'Paused' and letting RootStore logic set status
    const onResume = async () => {
      const schedule = props.params.data;
      // Remove 'Paused' status so RootStore logic will set it based on timePicker
      schedule.status = undefined;
      await rootStore.upsertSchedule(schedule);
      notificationStore.showToast({
        severity: "info",
        summary: "Resume",
        detail: "Schedule resumed.",
        life: 2000,
      });
    };

    return {
      onDelete,
      onCopy,
      onPause,
      onResume,
      rootStore,
      isLoggedIn,
      isSystemRow,
      onEditSystem,
    };
  },
});
</script>

<style>
.button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%; /* Takes full height of the grid cell */
}

.action-btn {
  min-width: 30px;
  min-height: 30px;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  margin-right: 4px;
}

.delete-btn .icon {
  color: #d32f2f; /* red */
}
.copy-btn .icon {
  color: #ffb743; /* warning (amber) */
}
.play-btn .icon {
  color: #388e3c; /* green */
}
.pause-btn .icon {
  color: #0288d1; /* info (blue) */
}
.edit-btn .icon {
  color: #90caf9; /* light blue */
}

.icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
