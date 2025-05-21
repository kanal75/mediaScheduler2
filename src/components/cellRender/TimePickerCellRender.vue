<template>
  <div class="time-picker-cell">
    <Tag
      v-if="dateArray.length > 0"
      severity="info"
      style="margin-right: 8px; display: inline"
      >{{ formatDate(dateArray[0]) }}</Tag
    >

    <span
      v-if="dateArray.length > 1"
      class="time-separator"
      style="margin-right: 8px; display: inline"
    >
      <i class="pi pi-arrow-right"></i>
    </span>
    <Tag
      v-if="dateArray.length > 1"
      severity="success"
      style="margin-right: 8px; display: inline"
      >{{ formatDate(dateArray[1]) }}</Tag
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import dayjs from "dayjs";

export default defineComponent({
  name: "TimePickerCellRenderer",
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const dateArray = computed<string[]>(() => {
      const val = props.params.value;
      return Array.isArray(val) ? val : [];
    });
    const formatDate = (dateStr: string): string => {
      return dayjs(dateStr).format("YYYY-MM-DD HH:mm");
    };
    return {
      dateArray,
      formatDate,
    };
  },
});
</script>
