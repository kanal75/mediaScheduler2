<template>
  <div class="p-field">
    <div class="manual-inline-row">
      <div class="manual-tile">
        <div class="custom-input-group manual-group">
          <span class="custom-input-group-addon">Start</span>
          <div class="manual-input-shell">
            <InputMask
              v-model="manualStart"
              mask="9999-99-99 99:99"
              placeholder="YYYY-MM-DD HH:MM"
              class="manual-date-input"
              @focus="onStartFocus"
              @keyup="onStartKeyup"
              @complete="onStartComplete"
              @blur="onStartBlur"
            />
          </div>
        </div>
        <small v-if="manualErrors.start" class="p-error mt-1 block">
          Invalid start date or start is after end (YYYY-MM-DD HH:MM)
        </small>
      </div>
      <div class="manual-tile">
        <div class="custom-input-group manual-group">
          <span class="custom-input-group-addon">End</span>
          <div class="manual-input-shell" ref="endInputShellRef">
            <InputMask
              v-model="manualEnd"
              mask="9999-99-99 99:99"
              placeholder="YYYY-MM-DD HH:MM"
              class="manual-date-input"
              @focus="selectAllText"
              @complete="() => updateManualSegment('end')"
              @blur="() => updateManualSegment('end')"
            />
          </div>
        </div>
        <small v-if="manualErrors.end" class="p-error mt-1 block">
          Invalid end date or end is before start (YYYY-MM-DD HH:MM)
        </small>
      </div>
      <div class="manual-calendar-container">
        <button
          type="button"
          class="manual-calendar-tile"
          @click="openCalendar"
          @keydown.enter.prevent="openCalendar"
          @keydown.space.prevent="openCalendar"
        >
          <i class="pi pi-calendar" />
        </button>
        <DatePicker
          ref="dp"
          v-model="localRange"
          selectionMode="range"
          showTime
          :closeOnDateSelect="false"
          class="hidden-date-picker"
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
                @click="confirm($event)"
                label="OK"
              />
            </div>
          </template>
        </DatePicker>
      </div>
    </div>
    <div
      v-if="
        props.attemptedSubmit &&
        (!rootStore.newSchedule.timePicker ||
          rootStore.newSchedule.timePicker.length !== 2)
      "
      class="input-error"
    >
      Date is required.
    </div>
    <small
      v-if="attempted && !isComplete && localRange && localRange.length > 0"
      class="p-error mt-2 block"
    >
      Please select both start and end of the date range.
    </small>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, watch } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useDateRangePicker } from "@/components/composables/useDateRangePicker";
import DatePicker from "primevue/datepicker";
import InputMask from "primevue/inputmask";

export default defineComponent({
  name: "DateRangePickerSelect",
  components: { DatePicker, InputMask },
  props: {
    attemptedSubmit: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, { expose }) {
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
      manualStart,
      manualEnd,
      manualErrors,
      updateManualSegment,
      selectAllText,
    } = useDateRangePicker({
      initialRange: rootStore.newSchedule.timePicker,
      onChange: (range: string[]) => {
        rootStore.newSchedule.timePicker = range;
      },
    });

    // Keep picker in sync when newSchedule.timePicker is replaced externally (e.g. by speech)
    watch(
      () => rootStore.newSchedule.timePicker,
      (range) => {
        if (Array.isArray(range) && range.length === 2) {
          localRange.value = range.map(
            (s) => new Date(String(s).replace(" ", "T"))
          );
        }
      }
    );

    const endInputShellRef = ref<HTMLElement | null>(null);
    const startFieldActive = ref(false);
    const maskComplete = (value?: string | null) =>
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value.trim());
    const queueEndFocus = () => {
      nextTick(() => {
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
          window.requestAnimationFrame(() => focusEndInput());
        } else {
          setTimeout(focusEndInput, 0);
        }
      });
    };
    const focusEndInput = () => {
      const input = endInputShellRef.value?.querySelector("input");
      if (!input) return;
      input.focus();
      input.select();
    };

    const onStartComplete = () => {
      updateManualSegment("start");
      queueEndFocus();
    };

    const onStartKeyup = () => {
      if (maskComplete(manualStart.value)) {
        queueEndFocus();
      }
    };

    const onStartFocus = (event: Event) => {
      startFieldActive.value = true;
      selectAllText(event);
    };

    const onStartBlur = () => {
      startFieldActive.value = false;
      updateManualSegment("start");
    };

    watch(manualStart, (value) => {
      if (!startFieldActive.value) return;
      if (maskComplete(value)) {
        queueEndFocus();
      }
    });

    const openCalendar = (event?: MouseEvent | KeyboardEvent) => {
      const picker = dp.value as
        | { showOverlay?: () => void; overlayVisible?: boolean }
        | null
        | undefined;
      if (!picker) return;
      if (typeof picker.showOverlay === "function") {
        picker.showOverlay();
      } else {
        picker.overlayVisible = true;
      }
      event?.stopPropagation?.();
    };

    expose({ clear });

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
      manualStart,
      manualEnd,
      manualErrors,
      updateManualSegment,
      selectAllText,
      onStartFocus,
      onStartBlur,
      openCalendar,
      rootStore,
      props,
      endInputShellRef,
      focusEndInput,
      onStartComplete,
      onStartKeyup,
    };
  },
});
</script>

<style scoped>
.font-semibold {
  font-weight: 600;
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
/* Prompt styling */
.prompt {
  text-align: center;
  margin-bottom: 0.5rem;
  padding: 0.5em;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 4px;
}
.input-error {
  color: #e74c3c;
  font-size: 0.85em;
  margin-top: 0.15rem;
}
.custom-input-group {
  display: flex;
  align-items: stretch;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}
.custom-input-group-addon {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: inherit;
  background-color: transparent;
  font-weight: inherit;
  border-right: 1px solid var(--input-border-color, #d1d5db);
  min-width: 120px;
}
.custom-input-group > :not(.custom-input-group-addon) {
  flex: 1 1 0%;
  min-width: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  display: flex;
}
.custom-input-group,
.custom-input-group-addon,
.custom-input-group-content,
.schedule-input,
.p-selectbutton,
.p-inputtext,
.p-calendar,
.p-datepicker,
.p-inputswitch {
  min-height: 52px;
  box-sizing: border-box;
}
.manual-inline-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(64px, auto);
  align-items: stretch;
  gap: 0.9rem;
  margin-top: 0.85rem;
  width: 100%;
}
.manual-tile {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.manual-group {
  min-height: 52px;
}
.manual-input-shell {
  display: flex;
  flex: 1;
  align-items: stretch;
  background: transparent;
}
.manual-date-input {
  flex: 1 1 auto;
  border: none;
  background: transparent;
  padding: 0 0.75rem;
}
.manual-date-input:focus-within,
.manual-date-input input:focus {
  outline: none;
  box-shadow: none;
}
.manual-calendar-tile {
  min-width: 52px;
  height: 52px;
  border: 1px solid var(--input-border-color, #d1d5db);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.manual-calendar-tile:hover {
  color: #fff;
  border-color: #fff;
}
.manual-calendar-tile:focus-visible {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}
.manual-calendar-tile i {
  font-size: 1.1rem;
}
.manual-calendar-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
.hidden-date-picker {
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
@media (max-width: 768px) {
  .manual-inline-row {
    grid-template-columns: 1fr;
  }
}
</style>
