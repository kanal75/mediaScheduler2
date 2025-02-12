<template>
  <div class="time-picker-editor">
    <!-- Date and time range picker -->
    <VueDatePicker
      v-model:value="localValue"
      :dark="isDarkMode"
      range
      multi-calendars
      format="yyyy-MM-dd HH:mm"
      class="date-picker"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { useRefStore } from "@/store/RefStore";

export default defineComponent({
  name: "TimePickerCellEditor",
  components: { VueDatePicker },
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const refStore = useRefStore();
    const isDarkMode = computed(() => refStore.isDarkMode);

    // Get the initial range value from props (expected to be an array)
    const initialValue = props.params.value ?? [];
    // Create a local copy of the value bound to the picker
    const localValue = ref([...initialValue]);

    // Watch the localValue for any changes (date or time update)
    watch(
      localValue,
      (newValue) => {
        console.log("New range value:", newValue);
      },
      { deep: true }
    );

    return {
      isDarkMode,
      localValue,
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
</style>
