<template>
  <div class="p-field">
    <div class="custom-input-group">
      <span class="custom-input-group-addon">Specific Times</span>
      <div class="custom-input-group-content">
        <div v-if="enabled">
          <div
            v-for="(range, idx) in localRanges"
            :key="idx"
            class="specific-times-row"
          >
            <Calendar
              v-model="localRanges[idx][0]"
              timeOnly
              placeholder="From"
              :showIcon="true"
              :hideOnDateTimeSelect="true"
              class="schedule-input"
              style="width: 180px"
            />
            <span><i class="pi pi-arrow-right" /></span>
            <Calendar
              v-model="localRanges[idx][1]"
              timeOnly
              placeholder="To"
              :showIcon="true"
              :hideOnDateTimeSelect="true"
              class="schedule-input"
              style="width: 180px"
            />
            <Button
              icon="pi pi-plus"
              class="p-button-rounded p-button-success p-button-sm"
              @click="add"
              title="Add"
            />
            <Button
              icon="pi pi-minus"
              class="p-button-rounded p-button-danger p-button-sm"
              :disabled="localRanges.length === 1"
              @click="remove(idx)"
              title="Remove"
            />
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

export default defineComponent({
  name: "SpecificTimesSelect",
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
    function formatTime(d: Date | null) {
      if (!d) return "";
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      return `${hh}:${mm}`;
    }
    function getDefaultRange() {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      return [now, end];
    }

    const initialEnabled = ref(!!rootStore.newSchedule.specificTime);
    const initialRanges = ref(
      Array.isArray(rootStore.newSchedule.specificTimes) &&
        rootStore.newSchedule.specificTimes.length
        ? rootStore.newSchedule.specificTimes.map((r: string[]) => [
            parseTime(r[0]),
            parseTime(r[1]),
          ])
        : [getDefaultRange()]
    );
    const enabled = ref(initialEnabled.value);
    const localRanges = ref(
      initialRanges.value.length &&
        initialRanges.value[0][0] &&
        initialRanges.value[0][1]
        ? initialRanges.value.map((r) => [r[0], r[1]] as [Date, Date])
        : [getDefaultRange()]
    );

    const isComplete = computed(() => {
      if (!enabled.value) return true;
      return (
        Array.isArray(localRanges.value) &&
        localRanges.value.length > 0 &&
        localRanges.value.every(
          (arr) =>
            Array.isArray(arr) &&
            arr.length === 2 &&
            arr[0] instanceof Date &&
            arr[1] instanceof Date &&
            arr[0] < arr[1]
        )
      );
    });
    const timeError = computed(() => {
      if (!enabled.value) return "";
      for (const arr of localRanges.value) {
        if (!arr[0] || !arr[1]) {
          return "Start and end time are required.";
        }
        if (
          Array.isArray(arr) &&
          arr.length === 2 &&
          arr[0] instanceof Date &&
          arr[1] instanceof Date &&
          arr[0] >= arr[1]
        ) {
          return "Start time must be before end time.";
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
          ? (localRanges.value
              .map((arr) => [formatTime(arr[0]), formatTime(arr[1])])
              .filter((arr) => arr.length === 2) as [string, string][])
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
          .map((arr) => [formatTime(arr[0]), formatTime(arr[1])])
          .filter((arr) => arr.length === 2);
        if (!isEqual(newVal, localTimes)) {
          if (!newVal || !newVal.length) {
            enabled.value = false;
            localRanges.value = [getDefaultRange()];
          } else {
            enabled.value = true;
            localRanges.value = newVal
              .map((r) => [parseTime(r[0]), parseTime(r[1])])
              .filter((arr) => arr[0] && arr[1]) as [Date, Date][];
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
  width: 100%;
  max-width: 400px;
  min-width: 180px;
  box-sizing: border-box;
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
@media (max-width: 600px) {
  .specific-times-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .schedule-input {
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }
}
</style>
