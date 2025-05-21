<template>
  <div class="button-container" :class="{ disabled: !isLoggedIn }">
    <!-- Only render buttons if params.data exists -->
    <template v-if="params.data">
      <!-- Delete button -->
      <v-btn
        variant="outlined"
        class="action-btn delete-btn"
        density="compact"
        @click="onDelete"
        :disabled="!isLoggedIn"
      >
        <v-icon class="icon">mdi-delete-outline</v-icon>
      </v-btn>

      <!-- Copy button -->
      <v-btn
        variant="outlined"
        class="action-btn copy-btn"
        density="compact"
        @click="onCopy"
        :disabled="!isLoggedIn"
      >
        <v-icon class="icon">mdi-content-copy</v-icon>
      </v-btn>

      <!-- Pause/Play button -->
      <v-btn
        variant="outlined"
        class="action-btn play-btn"
        density="compact"
        v-if="params.data.status === 'Paused'"
        @click="onResume"
        :disabled="!isLoggedIn"
      >
        <v-icon class="icon">mdi-play</v-icon>
      </v-btn>
      <v-btn
        variant="outlined"
        class="action-btn pause-btn"
        density="compact"
        v-else
        @click="onPause"
        :disabled="!isLoggedIn"
      >
        <v-icon class="icon">mdi-pause</v-icon>
      </v-btn>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useNotificationStore } from "@/store/NotificationStore";
import { useAccountStore } from "@/store/AccountStore";

export default defineComponent({
  name: "ActionsCellRenderer",
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const rootStore = useRootStore();
    const accountStore = useAccountStore();
    const notificationStore = useNotificationStore();

    // State to track whether this row is currently in edit mode
    const editing = ref(false);

    const isLoggedIn = computed(() => !!accountStore.account);

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

    // Start editing the scheduleTags cell in this row
    const startEditingTags = () => {
      props.params.api.startEditingCell({
        rowIndex: props.params.node.rowIndex,
        colKey: "scheduleTags",
      });
    };

    // Start editing the timePicker cell in this row
    const startEditingTimePicker = () => {
      props.params.api.startEditingCell({
        rowIndex: props.params.node.rowIndex,
        colKey: "timePicker",
      });
    };

    // Listen for editing stopped event to chain editors
    function onEditingStopped(event: any) {
      if (
        event.rowIndex === props.params.node.rowIndex &&
        event.column.getColId() === "scheduleTags"
      ) {
        // After tags editor closes, open timePicker
        setTimeout(() => {
          startEditingTimePicker();
        }, 0);
        // Remove listener after use
        props.params.api.removeEventListener(
          "cellEditingStopped",
          onEditingStopped
        );
      }
    }
    return {
      onDelete,
      onCopy,
      editing,
      onPause,
      onResume,
      rootStore,
      isLoggedIn,
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

.icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
