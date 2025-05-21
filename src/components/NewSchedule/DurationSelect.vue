<template>
  <div class="p-field">
    <div class="custom-input-group">
      <span class="custom-input-group-addon">Duration</span>
      <template v-if="isDisabled">
        <span class="duration-readonly">
          {{ mediaTimeCode || "--:--:--:--" }}
        </span>
      </template>
      <template v-else>
        <InputNumber
          v-model="displaySeconds"
          :min="5"
          showButtons
          placeholder="Enter Duration"
          inputClass="duration-input"
          @input="onInput"
          class="w-full"
          style="border: none !important; box-shadow: none !important"
        />
        <span class="custom-input-group-addon">Seconds</span>
      </template>
    </div>
    <div v-if="showErrorComputed" class="input-error">
      Please enter a valid number of seconds.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted } from "vue";
import { useRootStore } from "@/store/RootStore";

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
  name: "DurationSelect",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    showError: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const rootStore = useRootStore();
    const localError = ref(false);
    const t = computed(() =>
      (rootStore.newSchedule.scheduleTypes || "").toLowerCase()
    );
    const isDisabled = computed(
      () => t.value === "clip" || t.value === "music"
    );
    const mediaTimeCode = computed(
      () =>
        rootStore.newSchedule.metaData?.MediaInfo?.Durations?.[0]?.TimeCode ||
        ""
    );
    const displaySeconds = ref(0);
    watch(
      [
        () => props.modelValue,
        isDisabled,
        () => rootStore.newSchedule.metaData.MediaInfo,
      ],
      ([val, disabled]) => {
        if (disabled) {
          // Show MediaInfo.Durations[0].TimeCode if available
          const tc =
            rootStore.newSchedule.metaData?.MediaInfo?.Durations?.[0]?.TimeCode;
          if (tc && /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(tc)) {
            displaySeconds.value = timecodeToSeconds(tc);
          } else {
            displaySeconds.value = 0;
          }
        } else {
          if (val && /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(val)) {
            displaySeconds.value = timecodeToSeconds(val);
          } else {
            displaySeconds.value = 20; // default
          }
        }
      },
      { immediate: true }
    );
    watch(
      () => displaySeconds.value,
      (val) => {
        if (!isDisabled.value) {
          emit("update:modelValue", secondsToTimecode(val));
        }
      }
    );
    onMounted(() => {
      if (!props.modelValue) {
        let initialSeconds = 20;
        if (isDisabled.value) {
          const tc =
            rootStore.newSchedule.metaData?.MediaInfo?.Durations?.[0]?.TimeCode;
          if (tc && /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(tc)) {
            initialSeconds = timecodeToSeconds(tc);
          } else {
            initialSeconds = 0;
          }
        }
        displaySeconds.value = initialSeconds;
        emit("update:modelValue", secondsToTimecode(initialSeconds));
      }
    });
    watch(
      () => rootStore.selectedFile,
      (file) => {
        if (file && file.Data && !isDisabled.value) {
          let seconds = displaySeconds.value || 20;
          file.Data.duration = secondsToTimecode(seconds);
        }
      },
      { immediate: true }
    );
    const onInput = () => {
      if (
        displaySeconds.value === null ||
        displaySeconds.value === undefined ||
        isNaN(displaySeconds.value) ||
        displaySeconds.value < 5
      ) {
        localError.value = true;
      } else {
        localError.value = false;
      }
    };
    const showErrorComputed = computed(() => {
      return props.showError || localError.value;
    });
    return {
      displaySeconds,
      onInput,
      showErrorComputed,
      isDisabled,
      mediaTimeCode,
    };
  },
});
</script>

<style scoped>
.duration-input {
  width: 100%;
}
.input-error {
  color: #e74c3c;
  font-size: 0.85em;
  margin-top: 0.25rem;
}
.custom-input-group {
  display: flex;
  align-items: stretch;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  min-height: 52px;
}
.custom-input-group-addon {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  font-weight: 500;
  border-right: 1px solid var(--input-border-color, #d1d5db);
  min-width: 90px;
  min-height: 52px;
}
.custom-input-group-addon:last-child {
  border-right: none;
  border-left: 1px solid var(--input-border-color, #d1d5db);
}
.duration-readonly {
  flex: 1 1 0%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: none;
  color: #fff;
  font-size: 1rem;
  padding: 0 1rem;
  letter-spacing: 0.05em;
  border: none;
  box-shadow: none;
}
.custom-input-group > :not(.custom-input-group-addon) {
  flex: 1 1 0%;
  min-width: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  display: flex;
  align-items: center;
}
.custom-input-group .p-inputnumber {
  width: 100%;
  border: none;
  box-shadow: none;
  background: transparent;
  min-height: 52px;
  display: flex;
  align-items: center;
}
:deep(.p-inputtext.p-component.p-inputnumber-input.duration-input) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
</style>
