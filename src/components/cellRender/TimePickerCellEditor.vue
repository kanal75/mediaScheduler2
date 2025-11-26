<template>
  <div class="tpce-root">
    <div class="tpce-input-group">
      <div class="tpce-input-group-content">
        <div class="tpce-row">
          <div class="tpce-field">
            <div class="tpce-field-input">
              <InputMask
                v-model="manualStart"
                mask="9999-99-99 99:99"
                placeholder="YYYY-MM-DD HH:MM"
                class="tpce-mask"
                aria-label="Start date time"
                @focus="onStartFocus"
                @keyup="onStartKeyup"
                @complete="onStartComplete"
                @blur="onStartBlur"
              />
            </div>
            <small v-if="manualErrors.start" class="tpce-error">
              Invalid start date or start is after end (YYYY-MM-DD HH:MM)
            </small>
          </div>
          <span class="tpce-arrow" aria-hidden="true">
            <i class="pi pi-chevron-right" />
          </span>
          <div class="tpce-field">
            <div class="tpce-field-input" ref="endInputShellRef">
              <InputMask
                v-model="manualEnd"
                mask="9999-99-99 99:99"
                placeholder="YYYY-MM-DD HH:MM"
                class="tpce-mask"
                aria-label="End date time"
                @focus="selectAllText"
                @complete="() => updateManualSegment('end')"
                @blur="() => updateManualSegment('end')"
              />
            </div>
            <small v-if="manualErrors.end" class="tpce-error">
              Invalid end date or end is before start (YYYY-MM-DD HH:MM)
            </small>
          </div>
          <button
            type="button"
            class="tpce-calendar-btn"
            @click="openCalendar"
            @keydown.enter.prevent="openCalendar"
            @keydown.space.prevent="openCalendar"
          >
            <i class="pi pi-calendar" />
          </button>
        </div>
      </div>
    </div>
    <small v-if="attempted && !isComplete" class="p-error mt-2 block">
      Please select both start and end of the date range.
    </small>
    <DatePicker
      ref="dp"
      v-model="localRange"
      selectionMode="range"
      showTime
      :closeOnDateSelect="false"
      class="hidden-date-picker"
      :style="hiddenPickerStyle"
      dateFormat="yy-mm-dd"
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
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, watch } from "vue";
import { useDateRangePicker } from "@/components/composables/useDateRangePicker";
import { useRootStore } from "@/store/RootStore";
import DatePicker from "primevue/datepicker";
import InputMask from "primevue/inputmask";

export default defineComponent({
  name: "TimePickerCellEditor",
  components: { DatePicker, InputMask },
  props: {
    params: { type: Object, required: true },
  },
  emits: ["edit"],
  setup(props) {
    // Root store to persist changes
    const rootStore = useRootStore();
    // Initialize with the current cell value if present
    const initialRange =
      Array.isArray(props.params.value) && props.params.value.length === 2
        ? props.params.value.map((d: string | Date) =>
            d instanceof Date ? d : new Date(d)
          )
        : undefined;
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
      initialRange,
      onChange: (range: string[]) => {
        rootStore.newSchedule.timePicker = range;
      },
    });

    const endInputShellRef = ref<HTMLElement | null>(null);
    const startFieldActive = ref(false);
    const maskComplete = (value?: string | null) =>
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value.trim());

    const focusEndInput = () => {
      const input = endInputShellRef.value?.querySelector("input");
      if (!input) return;
      input.focus();
      input.select();
    };

    const queueEndFocus = () => {
      nextTick(() => {
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
          window.requestAnimationFrame(() => focusEndInput());
        } else {
          setTimeout(focusEndInput, 0);
        }
      });
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

    const hiddenPickerStyle = {
      position: "absolute",
      width: "1px",
      minWidth: "1px",
      height: "1px",
      opacity: "0",
      pointerEvents: "none",
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
    } as const;

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
      manualStart,
      manualEnd,
      manualErrors,
      updateManualSegment,
      selectAllText,
      endInputShellRef,
      onStartComplete,
      onStartKeyup,
      onStartFocus,
      onStartBlur,
      openCalendar,
      hiddenPickerStyle,
    };
  },
});
</script>

<style>
.tpce-root {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  background: var(
    --ag-background-color,
    var(--p-surface-0, var(--p-surface-card, var(--el-bg-color, #111827)))
  );
  color: var(
    --ag-foreground-color,
    var(--el-text-color-regular, var(--p-text-color, #f9fafb))
  );
  padding: 8px;
  border-radius: 6px;
}
.tpce-input-group {
  display: flex;
  align-items: stretch;
  border: 1px solid #9ca3af;
  border-radius: 6px;
  overflow: hidden;
}
.tpce-input-group-addon {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  /* no local title anymore; keep only structural styles if used elsewhere */
  border-right: 1px solid var(--input-border-color, #9ca3af);
  min-width: 120px;
}
.tpce-input-group-content {
  flex: 1 1 0%;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
}
.tpce-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  flex-wrap: wrap;
}
.tpce-field {
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.tpce-field-input {
  display: flex;
  align-items: center;
  border: 1px solid #9ca3af;
  border-radius: 6px;
  padding: 0 0.75rem;
  min-height: 52px;
  /* let PrimeVue theme provide colors */
  background: transparent;
  color: inherit;
}
.tpce-mask {
  flex: 1;
  border: none;
  background: transparent;
}
.tpce-field-input .tpce-mask,
.tpce-field-input .tpce-mask input,
.tpce-field-input .tpce-mask :where(.p-inputtext),
.tpce-field-input :where(.p-inputmask),
.tpce-field-input :where(.p-inputtext) {
  width: 100% !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  color: inherit !important;
  padding: 0 !important;
}
.tpce-mask:focus-within {
  box-shadow: inset 0 0 0 1px var(--primary-color, #3b82f6);
}
.tpce-error {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #e74c3c;
}
.tpce-arrow {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  border: 1px solid #9ca3af;
  border-radius: 9999px;
  /* let theme color it */
  background: transparent;
  color: inherit;
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.06);
}
.tpce-arrow i {
  font-size: 0.9rem;
}
.tpce-arrow:hover {
  border-color: #e5e7eb;
  background: #374151;
}
/* arrow hover and dark colors now come from theme */

.tpce-calendar-btn {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border: 1px solid var(--input-border-color, #9ca3af);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.tpce-calendar-btn i {
  font-size: 1.1rem;
}
@media (prefers-color-scheme: light) {
  .tpce-calendar-btn {
    background-color: #f9fafb;
    border-color: #d1d5db;
    color: #111827;
  }
}
@media (prefers-color-scheme: dark) {
  .tpce-calendar-btn {
    background-color: #111827;
    border-color: #d1d5db;
    color: #f9fafb;
  }
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
:deep(.hidden-date-picker) {
  position: absolute !important;
  width: 1px !important;
  min-width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
  overflow: hidden !important;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}
:deep(.hidden-date-picker .p-datepicker-trigger),
:deep(.hidden-date-picker .p-inputtext),
:deep(.hidden-date-picker .p-button) {
  display: none !important;
}
</style>

<style>
.p-datepicker:not(.hidden-date-picker) {
  min-width: 150px !important;
  width: 150px !important;
  max-width: 100% !important;
}
</style>
