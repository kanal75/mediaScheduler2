<template>
  <div>
    <Tag
      class="status-tag"
      v-if="chipLabel"
      :value="chipLabel"
      :severity="chipSeverity"
    >
      <template #default>
        {{ chipLabel }}
      </template>
    </Tag>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import dayjs from "dayjs";
import Tag from "primevue/tag";

export default defineComponent({
  name: "StatusCellRender",
  components: { Tag },
  props: {
    params: {
      type: Object,
      default: () => ({ value: "", data: {} }),
    },
  },
  setup(props) {
    const computedStatus = computed(() => {
      // Use params.value if present (for group rows), otherwise compute from data
      if (props.params.value) return props.params.value;
      const tp = props.params.data?.timePicker;
      if (!Array.isArray(tp) || tp.length !== 2) {
        return "";
      }
      const [s, e] = tp.map((t: string) => dayjs(t));
      if (!s.isValid() || !e.isValid()) {
        return "Unscheduled";
      }
      const now = dayjs();
      if (now.isAfter(e)) return "Passed";
      if (now.isBefore(s)) return "Scheduled";
      return now.isSame(s) ||
        now.isSame(e) ||
        (now.isAfter(s) && now.isBefore(e))
        ? "Active"
        : "Unscheduled";
    });

    const chipSeverity = computed(() => {
      if (computedStatus.value === "Paused") {
        return "info";
      }
      switch (computedStatus.value) {
        case "Passed":
          return "primary";
        case "Active":
          return "success";
        case "Scheduled":
          return "warn";
        case "Unscheduled":
          return "danger";
        default:
          return "info";
      }
    });

    const chipLabel = computed(() => computedStatus.value);

    return {
      chipLabel,
      chipSeverity,
    };
  },
});
</script>

<style scoped>
.status-tag {
  margin: 0; /* no external gap */
  padding: 0 4px; /* zero top/bottom, small left/right */
  display: inline-block;
  line-height: 1; /* minimal height exactly matching font */
  font-size: inherit; /* respect parent font sizing */
}

.p-tag {
  display: initial !important;
  /* ...existing code... */
}
</style>
