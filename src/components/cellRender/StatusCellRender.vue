<template>
  <!-- A single Vuetify chip that changes based on `status` -->
  <v-chip class="ma-2" :color="chipColor" variant="tonal" size="small">
    <v-icon :icon="chipIcon" start></v-icon>
    {{ chipLabel }}
  </v-chip>
</template>

<script>
export default {
  name: "StatusCellRender",
  props: {
    // AG Grid passes an object with lots of goodies—incl. `value`
    params: {
      type: Object,
      default: () => ({ value: "" }),
    },
  },
  computed: {
    status() {
      // "Passed", "Active", "Scheduled", etc.
      return this.params.value;
    },
    chipColor() {
      switch (this.status) {
        case "Passed":
          return "gray";
        case "Active":
          return "success";
        case "Scheduled":
          return "orange";
        case "Unscheduled":
          return "red";
        default:
          return "blue-grey";
      }
    },
    chipIcon() {
      switch (this.status) {
        case "Passed":
          return "mdi-calendar-check-outline";
        case "Active":
          return "mdi-calendar-month-outline";
        case "Scheduled":
          return "mdi-calendar-clock-outline";
        case "Unscheduled":
          return "mdi-calendar-remove-outline";
        default:
          return "mdi-help";
      }
    },
    chipLabel() {
      // Could be exactly the status or a more user-friendly version
      return this.status;
    },
  },
};
</script>
