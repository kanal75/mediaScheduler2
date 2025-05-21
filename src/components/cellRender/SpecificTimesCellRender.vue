<template>
  <div class="specific-times-cell">
    <div v-for="(range, index) in timeRanges" :key="index">
      <span v-if="range.length > 0">
        <Tag severity="info" style="margin-right: 8px; display: inline">{{
          range[0]
        }}</Tag>
      </span>
      <span
        v-if="range.length > 1"
        class="time-separator"
        style="margin-right: 8px; display: inline"
      >
        <i class="pi pi-arrow-right"></i>
      </span>
      <span v-if="range.length > 1">
        <Tag severity="success" style="margin-right: 8px; display: inline">{{
          range[1]
        }}</Tag>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "SpecificTimesCellRender",
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    // Always treat as array of ranges: [["14:18","17:18"],["16:18","11:22"]]
    const timeRanges = computed(() => {
      let val = props.params.value;
      if (!Array.isArray(val)) return [];
      // If single nested array, flatten
      if (
        val.length === 1 &&
        Array.isArray(val[0]) &&
        typeof val[0][0] === "string"
      ) {
        return [val[0]];
      }
      // If array of arrays
      if (Array.isArray(val[0])) {
        return val.filter((arr) => Array.isArray(arr));
      }
      // If flat array, treat as one range
      if (typeof val[0] === "string") {
        return [val];
      }
      return [];
    });
    return { timeRanges };
  },
});
</script>
