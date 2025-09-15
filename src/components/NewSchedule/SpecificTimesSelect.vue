<template>
  <div class="p-field">
    <div class="custom-input-group">
      <span class="custom-input-group-addon">Specific Times</span>
      <div class="custom-input-group-content">
        <div v-if="enabled">
          <div
            v-for="(item, idx) in localRanges"
            :key="idx"
            class="specific-times-row"
          >
            <div
              class="all-week-checkbox"
              style="
                margin-right: 12px;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              <input
                type="checkbox"
                :id="`allweek-${idx}`"
                :checked="item.days.length === 7"
                @change="toggleAllWeek(idx, $event)"
              />
              <label :for="`allweek-${idx}`">All Week</label>
            </div>
            <div class="weekday-selectors">
              <Button
                v-for="(day, dIdx) in weekdays"
                :key="dIdx"
                :label="day.short"
                :class="[
                  'weekday-btn',
                  { selected: isDaySelected(item, dIdx) },
                ]"
                @click="toggleDay(idx, dIdx)"
                type="button"
                size="small"
              />
            </div>
            <div class="all-day-checkbox">
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
              class="schedule-input"
              :disabled="item.allDay"
            />
            <span><Icon name="arrow-right" /></span>
            <Calendar
              v-model="item.range[1]"
              timeOnly
              placeholder="To"
              :showIcon="true"
              :hideOnDateTimeSelect="true"
              class="schedule-input"
              :disabled="item.allDay"
            />
            <Button
              class="p-button-rounded p-button-success p-button-sm"
              @click="add"
              title="Add"
            >
              <template #icon>
                <Icon name="plus" />
              </template>
            </Button>
            <Button
              class="p-button-rounded p-button-danger p-button-sm"
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
      <span class="custom-input-group-addon switch-addon">
        <InputSwitch v-model="enabled" class="p-mr-3" />
      </span>
    </div>
    <div v-if="timeError" class="p-error mt-2 block">{{ timeError }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import { useRootStore } from "@/store/RootStore";
import isEqual from "lodash/isEqual";
import Calendar from "primevue/calendar";
import Button from "primevue/button";
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
  from: string;
  to: string;
  allDay?: boolean;
};

export default defineComponent({
  name: "SpecificTimesSelect",
  components: { Calendar, Button, InputSwitch, Icon },
  setup() {
    const rootStore = useRootStore();

    function parseTime(str: string) {
      if (!str) return null;
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
    function getDefaultRange() {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      return { days: [0], range: [now, end] as [Date, Date], allDay: false };
    }

    const initialEnabled = ref(!!rootStore.newSchedule.specificTime);
    const initialRanges = ref(
      Array.isArray(rootStore.newSchedule.specificTimes) &&
        rootStore.newSchedule.specificTimes.length
        ? rootStore.newSchedule.specificTimes.map((r: SpecificTimeRange) => {
            return {
              days: Array.isArray(r.days) ? r.days : [1],
              range: [parseTime(r.from), parseTime(r.to)] as [Date, Date],
              allDay: r.allDay || false,
            };
          })
        : [getDefaultRange()]
    );
    const enabled = ref(initialEnabled.value);
    const localRanges = ref(
      initialRanges.value.length &&
        initialRanges.value[0].range[0] &&
        initialRanges.value[0].range[1]
        ? initialRanges.value.map((r) => ({
            days: r.days,
            range: [r.range[0], r.range[1]] as [Date, Date],
            allDay: r.allDay || false,
          }))
        : [getDefaultRange()]
    );

    function toggleDay(idx: number, dayIdx: number) {
      const days = localRanges.value[idx].days;
      localRanges.value[idx].days = days.filter((d) => {
        if (typeof d === "number") return d !== dayIdx;
        if (typeof d === "string")
          return weekdays.findIndex((w) => w.long === d) !== dayIdx;
        return true;
      });
      if (!days.includes(dayIdx)) {
        localRanges.value[idx].days = [
          ...localRanges.value[idx].days,
          dayIdx,
        ].sort((a, b) => {
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

    watch(
      [enabled, localRanges],
      () => {
        const newTimes = enabled.value
          ? localRanges.value
              .map((item) => ({
                days: item.days.map((dIdx) =>
                  typeof dIdx === "number" ? weekdays[dIdx].long : dIdx
                ),
                from: formatTime(item.range[0]),
                to: formatTime(item.range[1]),
                allDay: item.allDay || false,
              }))
              .filter((item) => item.days.length && item.from && item.to)
          : [];
        if (
          !isEqual(rootStore.newSchedule.specificTimes, newTimes) ||
          rootStore.newSchedule.specificTime !== enabled.value
        ) {
          rootStore.newSchedule.specificTime = enabled.value;
          rootStore.newSchedule.specificTimes = newTimes;
        }
      },
      { deep: true }
    );

    watch(
      () => rootStore.newSchedule.specificTimes,
      (newVal) => {
        const localTimes = localRanges.value
          .map((item) => ({
            days: item.days.map((dIdx) =>
              typeof dIdx === "number" ? weekdays[dIdx].long : dIdx
            ),
            from: formatTime(item.range[0]),
            to: formatTime(item.range[1]),
            allDay: item.allDay || false,
          }))
          .filter((item) => item.days.length && item.from && item.to);
        if (!isEqual(newVal, localTimes)) {
          if (!newVal || !newVal.length) {
            enabled.value = false;
            localRanges.value = [getDefaultRange()];
          } else {
            enabled.value = true;
            localRanges.value = newVal
              .map(function (r: SpecificTimeRange) {
                // Convert weekday names back to indices if needed
                const dayIndices = Array.isArray(r.days)
                  ? r.days
                      .map((day) =>
                        typeof day === "string"
                          ? weekdays.findIndex((w) => w.long === day)
                          : day
                      )
                      .filter((idx) => idx !== -1)
                  : [1];
                return {
                  days: dayIndices,
                  range: [parseTime(r.from), parseTime(r.to)] as [Date, Date],
                  allDay: r.allDay || false,
                };
              })
              .filter((item) => item.range[0] && item.range[1]);
          }
        }
      },
      { immediate: true }
    );

    return {
      enabled,
      localRanges,
      isComplete,
      timeError,
      add,
      remove,
      weekdays,
      toggleDay,
      setAllDay,
      toggleAllWeek,
      isDaySelected,
    };
  },
});
</script>

<style scoped>
.p-error {
  color: #e74c3c;
  font-size: 0.85rem;
}
.schedule-input {
  width: 100% !important;
  max-width: 150px !important;
  min-width: 150px !important;
  box-sizing: border-box;
  height: 32px;
  font-size: 0.95rem;
  padding: 2px 8px;
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
  color: var(--input-group-addon-color, var(--el-text-color-regular, #ffffff));
  font-weight: 500;
  border-right: 1px solid var(--input-border-color, #d1d5db);
  min-width: 120px;
}
.switch-addon {
  border-right: none;
  border-left: 1px solid var(--input-border-color, #d1d5db);
  min-width: 60px;
  justify-content: center;
}
.custom-input-group-content {
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
.specific-times-row {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.all-week-checkbox {
  display: flex;
  align-items: center;
  margin-right: 12px;
  gap: 4px;
}
.weekday-selectors {
  display: flex;
  gap: 4px;
  margin-right: 12px;
}
.weekday-btn {
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
.weekday-btn :deep(.p-button-label),
.weekday-btn .p-button-label {
  color: inherit !important;
}
.weekday-btn.selected {
  /* Use app-specific vars with safe defaults to avoid theme white-on-white */
  background: var(--ms-selected-bg, #1976d2) !important;
  color: var(--ms-selected-fg, #ffffff) !important;
  border-color: var(--ms-selected-bg, #1976d2) !important;
}
.weekday-btn.selected:hover,
.weekday-btn.selected:focus {
  background: var(--ms-selected-bg-hover, #1e73c7) !important;
  border-color: var(--ms-selected-bg-hover, #1e73c7) !important;
}
/* PrimeVue Button label should inherit */
.weekday-btn.selected :deep(.p-button-label),
.weekday-btn.selected .p-button-label {
  color: inherit !important;
}
/* Increase specificity against PrimeVue variants */
.weekday-btn.p-button.selected,
.weekday-btn.p-button-text.selected,
.weekday-btn.p-button-outlined.selected {
  background: var(--ms-selected-bg, #1976d2) !important;
  color: var(--ms-selected-fg, #ffffff) !important;
  border-color: var(--ms-selected-bg, #1976d2) !important;
}
@media (prefers-color-scheme: dark) {
  .weekday-btn.selected,
  .weekday-btn.p-button.selected,
  .weekday-btn.p-button-text.selected,
  .weekday-btn.p-button-outlined.selected {
    background: var(--ms-selected-bg-dark, #1565c0) !important;
    color: var(--ms-selected-fg-dark, #ffffff) !important;
    border-color: var(--ms-selected-bg-dark, #1565c0) !important;
  }
}
.all-day-checkbox {
  display: flex;
  align-items: center;
  margin-right: 12px;
  gap: 4px;
}
@media (max-width: 600px) {
  .specific-times-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}
</style>
