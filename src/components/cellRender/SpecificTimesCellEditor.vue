<template>
  <div class="stce-root stce-single-row-compact">
    <div class="stce-input-group">
      <span class="stce-input-group-addon">Specific Times</span>
      <div class="stce-input-group-content">
        <div v-if="enabled">
          <div v-for="(item, idx) in localRanges" :key="idx" class="stce-row">
            <div class="stce-all-week-checkbox">
              <input
                type="checkbox"
                :id="`allweek-${idx}`"
                :checked="item.days.length === 7"
                @change="toggleAllWeek(idx, $event)"
              />
              <label :for="`allweek-${idx}`">All Week</label>
            </div>
            <div class="stce-weekday-selectors">
              <Button
                v-for="(day, dIdx) in weekdays"
                :key="dIdx"
                :label="day.short"
                :class="[
                  'stce-weekday-btn',
                  { selected: isDaySelected(item, dIdx) },
                ]"
                @click="toggleDay(idx, dIdx)"
                type="button"
                size="small"
              />
            </div>
            <div class="stce-all-day-checkbox">
              <input
                type="checkbox"
                :id="`allday-${idx}`"
                v-model="item.allDay"
                @change="setAllDay(idx)"
              />
              <label :for="`allday-${idx}`">All Day</label>
            </div>
            <Calendar
              v-model="item.range[0]"
              timeOnly
              placeholder="From"
              :showIcon="true"
              :hideOnDateTimeSelect="true"
              class="stce-schedule-input"
              :disabled="item.allDay"
            />
            <span><Icon name="arrow-right" /></span>
            <Calendar
              v-model="item.range[1]"
              timeOnly
              placeholder="To"
              :showIcon="true"
              :hideOnDateTimeSelect="true"
              class="stce-schedule-input"
              :disabled="item.allDay"
            />
            <Button
              class="p-button-rounded p-button-success p-button-sm stce-action-btn"
              @click="add"
              title="Add"
            >
              <template #icon>
                <Icon name="plus" />
              </template>
            </Button>
            <Button
              class="p-button-rounded p-button-danger p-button-sm stce-action-btn"
              :disabled="localRanges.length === 1"
              @click="remove(idx)"
              title="Remove"
            >
              <template #icon>
                <Icon name="minus" />
              </template>
            </Button>
          </div>
        </div>
      </div>
      <span class="stce-input-group-addon stce-switch-addon">
        <InputSwitch v-model="enabled" class="p-mr-3" />
      </span>
    </div>
    <div v-if="timeError" class="p-error mt-2 block">{{ timeError }}</div>
    <div class="stce-actions">
      <Button class="p-button-secondary" @click="clear" label="Clear" />
      <Button class="p-button-tertiary" @click="handleCancel" label="Cancel" />
      <Button
        class="p-button-primary"
        @click="handleOk"
        label="OK"
        :disabled="!isComplete"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRootStore } from "@/store/RootStore";
import Button from "primevue/button";
import Calendar from "primevue/calendar";
import InputSwitch from "primevue/inputswitch";
import Icon from "@/components/icons/Icon.vue";

const weekdays = [
  { short: "Mon", long: "Monday" },
  { short: "Tue", long: "Tuesday" },
  { short: "Wed", long: "Wednesday" },
  { short: "Thu", long: "Thursday" },
  { short: "Fri", long: "Friday" },
  { short: "Sat", long: "Saturday" },
  { short: "Sun", long: "Sunday" },
];

type SpecificTimeRange = {
  days: (number | string)[];
  range: [Date, Date];
  allDay?: boolean;
};

export default defineComponent({
  name: "SpecificTimesCellEditor",
  components: { Button, Calendar, InputSwitch, Icon },
  props: {
    params: { type: Object, required: true },
  },
  setup(props, { expose }) {
    const rootStore = useRootStore();

    function parseTime(str: string) {
      if (!str) return new Date();
      const [h, m] = str.split(":");
      const d = new Date();
      d.setHours(Number(h));
      d.setMinutes(Number(m));
      d.setSeconds(0);
      d.setMilliseconds(0);
      return d;
    }
    function isDaySelected(
      item: { days: (number | string)[] },
      dayIdx: number
    ): boolean {
      return item.days.some((d) =>
        typeof d === "number"
          ? d === dayIdx
          : weekdays.findIndex((w) => w.long === d) === dayIdx
      );
    }
    function formatTime(d: Date | null) {
      if (!d) return "";
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      return `${hh}:${mm}`;
    }
    function getDefaultRange(): SpecificTimeRange {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      return { days: [0], range: [now, end] as [Date, Date], allDay: false };
    }
    function isFullDayDates(from: Date | null, to: Date | null) {
      if (!from || !to) return false;
      return (
        from.getHours() === 0 &&
        from.getMinutes() === 0 &&
        to.getHours() === 23 &&
        to.getMinutes() === 59
      );
    }

    const initialEnabled = !!props.params.data.specificTime;
    const initialRanges: SpecificTimeRange[] =
      Array.isArray(props.params.data.specificTimes) &&
      props.params.data.specificTimes.length
        ? props.params.data.specificTimes.map((r: unknown) => {
            if (Array.isArray(r) && typeof r[0] === "string") {
              return {
                days: [0],
                range: [parseTime(r[0]), parseTime(r[1])] as [Date, Date],
                allDay: isFullDayDates(parseTime(r[0]), parseTime(r[1])),
              };
            }
            if (
              typeof r === "object" &&
              r !== null &&
              "from" in r &&
              "to" in r
            ) {
              const obj = r as {
                days?: (number | string)[];
                from: string;
                to: string;
                allDay?: boolean;
              };
              return {
                days: Array.isArray(obj.days)
                  ? obj.days.map((d: number | string) =>
                      typeof d === "string"
                        ? weekdays.findIndex((w) => w.long === d)
                        : d
                    )
                  : [0],
                range: [parseTime(obj.from), parseTime(obj.to)] as [Date, Date],
                allDay: isFullDayDates(parseTime(obj.from), parseTime(obj.to)),
              };
            }
            return getDefaultRange();
          })
        : [getDefaultRange()];

    const enabled = ref(initialEnabled);
    const localRanges = ref(initialRanges);

    const currentValue = computed(() =>
      localRanges.value.map((item: SpecificTimeRange) => ({
        days: item.days.map((dIdx) =>
          typeof dIdx === "number" ? weekdays[dIdx].long : dIdx
        ),
        from: formatTime(item.range[0]),
        to: formatTime(item.range[1]),
      }))
    );

    function toggleDay(idx: number, dayIdx: number) {
      const days = localRanges.value[idx].days;
      localRanges.value[idx].days = days.filter((d: number | string) => {
        if (typeof d === "number") return d !== dayIdx;
        if (typeof d === "string")
          return weekdays.findIndex((w) => w.long === d) !== dayIdx;
        return true;
      });
      if (!days.includes(dayIdx)) {
        localRanges.value[idx].days = [
          ...localRanges.value[idx].days,
          dayIdx,
        ].sort((a: number | string, b: number | string) => {
          const aIdx =
            typeof a === "number" ? a : weekdays.findIndex((w) => w.long === a);
          const bIdx =
            typeof b === "number" ? b : weekdays.findIndex((w) => w.long === b);
          return aIdx - bIdx;
        });
      }
    }
    function setAllDay(idx: number) {
      const item = localRanges.value[idx];
      if (item.allDay) {
        const d = new Date();
        const from = new Date(d.setHours(0, 0, 0, 0));
        const to = new Date(d.setHours(23, 59, 0, 0));
        item.range = [from, to];
      }
    }
    function toggleAllWeek(idx: number, event: Event) {
      if ((event.target as HTMLInputElement).checked) {
        localRanges.value[idx].days = weekdays.map((_, i) => i);
      } else {
        localRanges.value[idx].days = [];
      }
    }
    const isComplete = computed(() => {
      if (!enabled.value) return true;
      return (
        Array.isArray(localRanges.value) &&
        localRanges.value.length > 0 &&
        localRanges.value.every(
          (item) =>
            Array.isArray(item.range) &&
            item.range.length === 2 &&
            item.range[0] instanceof Date &&
            item.range[1] instanceof Date &&
            item.range[0] < item.range[1] &&
            Array.isArray(item.days) &&
            item.days.length > 0
        )
      );
    });
    const timeError = computed(() => {
      if (!enabled.value) return "";
      for (const item of localRanges.value) {
        if (!item.range[0] || !item.range[1]) {
          return "Start and end time are required.";
        }
        if (
          Array.isArray(item.range) &&
          item.range.length === 2 &&
          item.range[0] instanceof Date &&
          item.range[1] instanceof Date &&
          item.range[0] >= item.range[1]
        ) {
          return "Start time must be before end time.";
        }
        if (!item.days || !item.days.length) {
          return "At least one weekday must be selected.";
        }
      }
      return "";
    });
    function add() {
      localRanges.value.push(getDefaultRange());
    }
    function remove(idx: number) {
      if (localRanges.value.length > 1) {
        localRanges.value.splice(idx, 1);
      }
    }
    function clear() {
      localRanges.value = [getDefaultRange()];
      enabled.value = false;
    }
    function handleOk() {
      if (enabled.value) {
        rootStore.upsertSchedule({
          ...props.params.data,
          specificTime: true,
          specificTimes: currentValue.value,
        });
      } else {
        rootStore.upsertSchedule({
          ...props.params.data,
          specificTime: false,
          specificTimes: [],
        });
      }
      props.params.api.stopEditing();
    }
    function handleCancel() {
      enabled.value = initialEnabled;
      localRanges.value = initialRanges;
      props.params.api.stopEditing(true);
    }

    // Let AG Grid fetch the edited value and write it to the row's field
    function getValue() {
      return enabled.value ? currentValue.value : [];
    }
    expose({ getValue });

    return {
      enabled,
      localRanges,
      currentValue,
      isComplete,
      timeError,
      add,
      remove,
      clear,
      handleOk,
      handleCancel,
      weekdays,
      toggleDay,
      setAllDay,
      toggleAllWeek,
      formatTime,
      isDaySelected,
    };
  },
});
</script>
<style>
.stce-root {
  /* Follow AG Grid / PrimeVue / Element theme variables with sensible fallbacks */
  background: var(
    --ag-background-color,
    var(--p-surface-0, var(--p-surface-card, var(--el-bg-color, #ffffff)))
  );
  color: var(--ag-foreground-color, var(--el-text-color-regular, inherit));
  padding: 8px;
  border-radius: 6px;
}
.stce-input-group {
  display: flex;
  align-items: stretch;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}
.stce-input-group-addon {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: var(--input-group-addon-color, var(--el-text-color-regular, #ffffff));
  font-weight: 500;
  border-right: 1px solid var(--input-border-color, #d1d5db);
  min-width: 120px;
}
.stce-switch-addon {
  border-right: none;
  border-left: 1px solid var(--input-border-color, #d1d5db);
  min-width: 60px;
  justify-content: center;
}
.stce-input-group-content {
  flex: 1 1 0%;
  min-width: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  min-height: 52px;
}
.stce-row {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.stce-weekday-selectors {
  display: flex;
  gap: 4px;
  margin-right: 12px;
}
.stce-weekday-btn {
  min-width: 32px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--input-border-color, #d1d5db);
  background: var(--el-fill-color, var(--p-input-bg, inherit));
  color: var(
    --ms-btn-fg,
    var(--el-text-color-regular, var(--p-text-color, #1f2937))
  );
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
/* Ensure PrimeVue inner label inherits the computed color in all states */
.stce-weekday-btn :deep(.p-button-label),
.stce-weekday-btn .p-button-label {
  color: inherit !important;
}
@media (prefers-color-scheme: dark) {
  .stce-weekday-btn {
    border-color: var(--el-border-color, #444);
  }
}
.stce-weekday-btn.selected {
  /* Use app-specific vars with safe defaults to avoid theme white-on-white */
  background: var(--ms-selected-bg, #1976d2) !important;
  color: var(--ms-selected-fg, #ffffff) !important;
  border-color: var(--ms-selected-bg, #1976d2) !important;
}
.stce-weekday-btn.selected:hover,
.stce-weekday-btn.selected:focus {
  background: var(--ms-selected-bg-hover, #1e73c7) !important;
  border-color: var(--ms-selected-bg-hover, #1e73c7) !important;
}
/* PrimeVue Button label should inherit */
.stce-weekday-btn.selected :deep(.p-button-label),
.stce-weekday-btn.selected .p-button-label {
  color: inherit !important;
}
/* Increase specificity against PrimeVue variants */
.stce-weekday-btn.p-button.selected,
.stce-weekday-btn.p-button-text.selected,
.stce-weekday-btn.p-button-outlined.selected {
  background: var(--ms-selected-bg, #1976d2) !important;
  color: var(--ms-selected-fg, #ffffff) !important;
  border-color: var(--ms-selected-bg, #1976d2) !important;
}
@media (prefers-color-scheme: dark) {
  .stce-weekday-btn.selected,
  .stce-weekday-btn.p-button.selected,
  .stce-weekday-btn.p-button-text.selected,
  .stce-weekday-btn.p-button-outlined.selected {
    background: var(--ms-selected-bg-dark, #1565c0) !important;
    color: var(--ms-selected-fg-dark, #ffffff) !important;
    border-color: var(--ms-selected-bg-dark, #1565c0) !important;
  }
}
.stce-all-day-checkbox {
  display: flex;
  align-items: center;
  margin-right: 12px;
  gap: 4px;
}
.stce-all-week-checkbox {
  display: flex;
  align-items: center;
  margin-right: 12px;
  gap: 4px;
}
.stce-schedule-input {
  width: 100% !important;
  max-width: 150px !important;
  min-width: 150px !important;
  box-sizing: border-box;
  height: 32px;
  font-size: 0.95rem;
  padding: 2px 8px;
}
.stce-action-btn {
  margin-left: 4px;
  margin-right: 4px;
  border: 1px solid var(--input-border-color, #d1d5db);
  background: var(
    --ms-action-bg,
    var(--el-fill-color, var(--p-input-bg, #ffffff))
  );
  color: var(
    --ms-action-fg,
    var(--el-text-color-regular, var(--p-text-color, #1f2937))
  );
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  height: 32px;
  min-width: 32px;
  font-size: 0.95rem;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stce-action-btn.p-button,
.stce-action-btn.p-button-success,
.stce-action-btn.p-button-danger {
  /* Ensure we override PrimeVue variant backgrounds */
  background: var(
    --ms-action-bg,
    var(--el-fill-color, var(--p-input-bg, #ffffff))
  ) !important;
  color: var(
    --ms-action-fg,
    var(--el-text-color-regular, var(--p-text-color, #1f2937))
  ) !important;
  border-color: var(--input-border-color, #d1d5db) !important;
}
.stce-action-btn.p-button.p-component,
.stce-action-btn.p-button-success.p-component,
.stce-action-btn.p-button-danger.p-component {
  background: var(
    --ms-action-bg,
    var(--el-fill-color, var(--p-input-bg, #ffffff))
  ) !important;
  background-color: var(
    --ms-action-bg,
    var(--el-fill-color, var(--p-input-bg, #ffffff))
  ) !important;
  color: var(
    --ms-action-fg,
    var(--el-text-color-regular, var(--p-text-color, #1f2937))
  ) !important;
  border-color: var(--input-border-color, #d1d5db) !important;
  box-shadow: none !important;
}
.stce-action-btn:hover,
.stce-action-btn:focus {
  background: var(--ms-action-bg-hover, #e5e7eb) !important; /* slate-200 */
  border-color: var(--ms-action-border-hover, #c7cdd4) !important;
}
/* Ensure PrimeVue inner label inherits the computed color in all states */
.stce-action-btn :deep(.p-button-label),
.stce-action-btn .p-button-label,
.stce-action-btn :deep(.p-button-icon),
.stce-action-btn .p-button-icon {
  color: inherit !important;
}
.stce-action-btn .p-button-icon {
  opacity: 1 !important;
}
.stce-action-btn .p-button-icon svg {
  color: inherit !important;
  stroke: currentColor !important;
  fill: currentColor !important;
}
.stce-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (prefers-color-scheme: dark) {
  .stce-action-btn {
    border-color: var(--el-border-color, #444);
    background: var(--ms-action-bg-dark, var(--el-fill-color, #222));
    color: var(--ms-action-fg-dark, var(--el-text-color-regular, #ffffff));
  }
  .stce-action-btn.p-button.p-component,
  .stce-action-btn.p-button-success.p-component,
  .stce-action-btn.p-button-danger.p-component {
    background: var(--ms-action-bg-dark, var(--el-fill-color, #222)) !important;
    background-color: var(
      --ms-action-bg-dark,
      var(--el-fill-color, #222)
    ) !important;
    color: var(
      --ms-action-fg-dark,
      var(--el-text-color-regular, #ffffff)
    ) !important;
    border-color: var(--el-border-color, #444) !important;
    box-shadow: none !important;
  }
  .stce-action-btn:hover,
  .stce-action-btn:focus {
    background: var(--ms-action-bg-dark-hover, #2a2a2a) !important;
    border-color: var(--ms-action-border-dark-hover, #555) !important;
  }
}
.stce-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 18px;
}
@media (max-width: 600px) {
  .stce-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}
</style>
