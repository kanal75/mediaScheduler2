<template>
  <div class="p-field">
    <InputNumber
      v-model="seconds"
      :min="0"
      showButtons
      placeholder="Enter Duration"
      inputClass="duration-input"
      @input="onInput"
      @blur="onBlur"
    />
    <div v-if="showErrorComputed" class="input-error">
      Please enter a valid number of seconds.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import { useRootStore } from "@/store/RootStore";
import InputNumber from "primevue/inputnumber";

function secondsToTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const f = "00"; // No frames, always 00
  return `${h}:${m}:${s}:${f}`;
}

function timecodeToSeconds(tc: string): number {
  const parts = tc.split(":");
  if (parts.length !== 4) return 0;
  const [h, m, s] = parts.map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

export default defineComponent({
  name: "DurationCellEditor",
  components: { InputNumber },
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const rootStore = useRootStore();
    const seconds = ref(0);
    const localError = ref(false);
    // AG Grid: initial value from params.value (timecode string)
    onMounted(() => {
      const val = props.params.value;
      if (val && /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(val)) {
        seconds.value = timecodeToSeconds(val);
      } else {
        seconds.value = 20;
      }
    });
    // AG Grid: return value to grid
    const getValue = () => {
      // Persist the updated duration to the backend
      const newTimecode = secondsToTimecode(seconds.value);
      rootStore.upsertSchedule({
        ...props.params.data,
        metaData: {
          ...props.params.data.metaData,
          duration: newTimecode,
        },
      });
      return newTimecode;
    };
    // AG Grid: stop editing on blur
    const onBlur = () => {
      props.params.api.stopEditing();
    };
    // Validate and update error
    const onInput = () => {
      if (
        seconds.value === null ||
        seconds.value === undefined ||
        isNaN(seconds.value) ||
        seconds.value < 5
      ) {
        localError.value = true;
      } else {
        localError.value = false;
      }
    };
    const showErrorComputed = computed(() => localError.value);
    return { seconds, onInput, onBlur, showErrorComputed, getValue };
  },
});
</script>

<style scoped>
.duration-input {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.input-error {
  color: #e74c3c;
  font-size: 0.85em;
  margin-top: 0.25rem;
}
</style>
