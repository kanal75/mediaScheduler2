<template>
  <div class="time-picker-cell">
    <!-- Loop through each date string and format it -->
    <span v-for="(dateStr, index) in dateArray" :key="index" class="date-item">
      {{ formatDate(dateStr) }}
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
// You can replace dayjs with date-fns, moment, etc.
import dayjs from "dayjs";

export default defineComponent({
  name: "TimePickerCellRenderer",
  props: {
    // AG Grid passes the cell 'params'
    params: { type: Object, required: true },
  },
  setup(props) {
    // The cell value is expected to be an array of date/time strings
    const dateArray = computed<string[]>(() => {
      const val = props.params.value;
      return Array.isArray(val) ? val : [];
    });

    // Simple date/time formatter
    const formatDate = (dateStr: string): string => {
      // e.g. "YYYY-MM-DD HH:mm"
      return dayjs(dateStr).format("YYYY-MM-DD HH:mm");
    };

    return {
      dateArray,
      formatDate,
    };
  },
});
</script>

<style scoped>
.time-picker-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.date-item {
  background-color: #edf2f7;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.85rem;
  color: #333;
}
</style>
