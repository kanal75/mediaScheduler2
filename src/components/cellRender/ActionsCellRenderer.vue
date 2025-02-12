<template>
  <div class="button-container">
    <!-- Delete button -->
    <v-btn
      variant="outlined"
      class="action-btn"
      density="compact"
      @click="onDelete"
    >
      <v-icon class="icon">mdi-delete-outline</v-icon>
    </v-btn>

    <!-- Edit button (toggles editing on the 'scheduleTags' column) -->
    <v-btn
      variant="outlined"
      :color="editing ? 'warning' : undefined"
      class="action-btn"
      density="compact"
      @click="toggleEdit"
    >
      <v-icon class="icon">mdi-pencil-outline</v-icon>
    </v-btn>

    <!-- Copy button -->
    <v-btn
      variant="outlined"
      class="action-btn"
      density="compact"
      @click="onCopy"
    >
      <v-icon class="icon">mdi-content-copy</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRootStore } from "@/store/RootStore";

export default defineComponent({
  name: "ActionsCellRenderer",
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const rootStore = useRootStore();

    // State to track whether this row is currently in edit mode
    const editing = ref(false);

    const onDelete = () => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        props.params.api.applyTransaction({ remove: [props.params.data] });
      }
    };

    const onCopy = () => {
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
    };

    // Start editing the scheduleTags cell in this row
    const startEditing = () => {
      props.params.api.startEditingCell({
        rowIndex: props.params.node.rowIndex,
        colKey: "scheduleTags",
      });
      editing.value = true;
    };

    // Stop editing, which in turn saves changes by default
    const stopEditing = () => {
      // The default stopEditing() saves changes
      // If you want to discard changes instead, use stopEditing(true)
      props.params.api.stopEditing(false);
      editing.value = false;
    };

    // Toggles editing mode
    const toggleEdit = () => {
      if (!editing.value) {
        startEditing();
      } else {
        stopEditing();
      }
    };

    return {
      onDelete,
      onCopy,
      toggleEdit,
      editing,
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

.icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
