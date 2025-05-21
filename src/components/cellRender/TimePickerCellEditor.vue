<template>
  <div class="time-picker-editor">
    <DatePicker
      ref="dp"
      v-model="localRange"
      selectionMode="range"
      showTime
      inline
      :closeOnDateSelect="false"
      class="date-picker"
      dateFormat="yy-mm-dd"
      showIcon
      placeholder="Select Date"
      @show="onShow"
      @update:modelValue="onDateChange"
    >
      <template #footer>
        <div v-if="showPrompt" class="prompt">
          Please choose the <strong>{{ promptWord }}</strong
          >.
        </div>
        <div class="p-datepicker-buttonbar">
          <Button
            class="p-button-text p-button-sm"
            @click="clear"
            label="Clear"
          />
          <Button
            class="p-button-text p-button-sm today-btn"
            @click="today"
            label="Today"
          />
          <Button
            class="p-button-text p-button-sm"
            :disabled="!isComplete"
            @click="handleOk($event)"
            label="OK"
          />
        </div>
      </template>
    </DatePicker>
    <small v-if="attempted && !isComplete" class="p-error mt-2 block">
      Please select both start and end of the date range.
    </small>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useDateRangePicker } from "@/components/composables/useDateRangePicker";
import { useRootStore } from "@/store/RootStore";

export default defineComponent({
  name: "TimePickerCellEditor",
  props: {
    params: { type: Object, required: true },
  },
  emits: ["edit"],
  setup(props) {
    // Root store to persist changes
    const rootStore = useRootStore();
    const {
      dp,
      attempted,
      showPrompt,
      promptWord,
      localRange,
      isComplete,
      clear,
      today,
      confirm,
      onShow,
      onDateChange,
    } = useDateRangePicker({
      initialRange: rootStore.newSchedule.timePicker,
      onChange: (range: string[]) => {
        rootStore.newSchedule.timePicker = range;
      },
    });

    // Helper to format date as in the composable
    function formatDate(d: Date) {
      const Y = d.getFullYear();
      const M = String(d.getMonth() + 1).padStart(2, "0");
      const D = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${Y}-${M}-${D} ${h}:${m}`;
    }

    // AG Grid will call this to get the value when editing ends
    const getValue = () => {
      if (
        Array.isArray(localRange.value) &&
        localRange.value.length === 2 &&
        localRange.value[0] instanceof Date &&
        localRange.value[1] instanceof Date
      ) {
        const newValue = [
          formatDate(localRange.value[0]),
          formatDate(localRange.value[1]),
        ];
        // Persist the updated timePicker to the backend
        rootStore.upsertSchedule({
          ...props.params.data,
          timePicker: newValue,
        });
        return newValue;
      }
      return [];
    };

    // Close the editor when OK is clicked
    function handleOk(event: MouseEvent) {
      confirm(event);
      // AG Grid: stop editing and save
      props.params.api.stopEditing();
    }

    return {
      dp,
      attempted,
      showPrompt,
      promptWord,
      localRange,
      isComplete,
      clear,
      today,
      confirm,
      onShow,
      onDateChange,
      getValue,
      handleOk,
    };
  },
});
</script>

<style scoped>
.time-picker-editor {
  display: flex;
  align-items: center;
}
.date-picker {
  min-width: 220px;
}
.p-error {
  color: #e74c3c;
  font-size: 0.85rem;
}
.p-datepicker-buttonbar {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 0.5rem;
}
.today-btn {
  margin: 0 auto;
}
.prompt {
  text-align: center;
  margin-bottom: 0.5rem;
  padding: 0.5em;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 4px;
}
</style>
