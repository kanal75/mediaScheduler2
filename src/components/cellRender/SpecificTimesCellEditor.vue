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
                  { selected: item.days.includes(dIdx) },
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

    const initialEnabled = !!props.params.data.specificTime;
    const initialRanges: SpecificTimeRange[] =
      Array.isArray(props.params.data.specificTimes) &&
      props.params.data.specificTimes.length
        ? props.params.data.specificTimes.map((r: unknown) => {
            if (Array.isArray(r) && typeof r[0] === "string") {
              return {
                days: [0],
                range: [parseTime(r[0]), parseTime(r[1])] as [Date, Date],
                allDay: false,
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
                allDay: obj.allDay || false,
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
        allDay: item.allDay || false,
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
  color: var(--el-text-color-regular, var(--p-text-color, inherit));
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
@media (prefers-color-scheme: dark) {
  .stce-weekday-btn {
    border-color: var(--el-border-color, #444);
  }
}
.stce-weekday-btn.selected {
  background: var(--el-color-primary, var(--p-primary-color, #1976d2));
  color: var(--el-color-primary-text, var(--p-primary-color-text, #fff));
  border-color: var(--el-color-primary, var(--p-primary-color, #1976d2));
}
@media (prefers-color-scheme: dark) {
  .stce-weekday-btn.selected {
    background: #1565c0 !important;
    color: #fff !important;
    border-color: #1565c0 !important;
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
.stce-action-btn {
  margin-left: 4px;
  margin-right: 4px;
  border: 1px solid var(--input-border-color, #d1d5db);
  background: var(--el-fill-color, var(--p-input-bg, #fff));
  color: var(--el-text-color-regular, var(--p-text-color, #333));
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  height: 32px;
  min-width: 32px;
  font-size: 0.95rem;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stce-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (prefers-color-scheme: dark) {
  .stce-action-btn {
    border-color: var(--el-border-color, #444);
    background: var(--el-fill-color, #222);
    color: var(--el-text-color-regular, #fff);
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
