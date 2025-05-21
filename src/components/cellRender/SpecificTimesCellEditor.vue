<template>
  <Card style="border-radius: 5px">
    <template #content>
      <div style="display: flex; flex-direction: column">
        <div style="margin: 5px; display: flex; align-items: center">
          <InputSwitch v-model="enabled" class="p-mr-3" />
          <span style="margin: 10px">Enable Specific Times</span>
        </div>
        <div v-if="enabled">
          <div
            v-for="(range, idx) in localRanges"
            :key="idx"
            style="margin: 5px; display: flex; align-items: center; gap: 16px"
            class="p-inputtext"
          >
            <Calendar
              v-model="localRanges[idx][0]"
              timeOnly
              placeholder="From"
              :showIcon="true"
              :hideOnDateTimeSelect="true"
              style="width: 120px"
            />
            <span><i class="pi pi-arrow-right" /></span>
            <Calendar
              v-model="localRanges[idx][1]"
              timeOnly
              placeholder="To"
              :showIcon="true"
              :hideOnDateTimeSelect="true"
              style="width: 120px"
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
        <div v-if="timeError" class="p-error mt-2 block">{{ timeError }}</div>
        <div
          style="
            margin: 5px;
            display: flex;
            justify-content: space-between;
            gap: 8px;
          "
        >
          <div>
            <Button
              class="p-button-secondary"
              @click="clear"
              label="Clear"
              style="margin-right: 8px"
            />
            <Button
              class="p-button-tertiary"
              @click="handleCancel"
              label="Cancel"
            />
          </div>
          <Button
            class="p-button-primary"
            @click="handleOk"
            label="OK"
            :disabled="!isComplete"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRootStore } from "@/store/RootStore";

export default defineComponent({
  name: "SpecificTimesCellEditor",

  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const rootStore = useRootStore();
    const initialEnabled = !!props.params.data.specificTime;
    const initialRanges = Array.isArray(props.params.data.specificTimes)
      ? JSON.parse(JSON.stringify(props.params.data.specificTimes))
      : [["", ""]];
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
    // Set default range to now and now + 1 hour
    function getDefaultRange() {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      return [now, end];
    }
    const enabled = ref(initialEnabled);
    const localRanges = ref(
      initialRanges.length && initialRanges[0][0] && initialRanges[0][1]
        ? initialRanges.map((r: string[]) => [parseTime(r[0]), parseTime(r[1])])
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
            arr[0] < arr[1] // start must be before end
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
    function clear() {
      localRanges.value = [getDefaultRange()];
      enabled.value = false;
    }
    function handleOk() {
      // Update the schedule/item in the store only when OK is clicked
      if (enabled.value) {
        rootStore.upsertSchedule({
          ...props.params.data,
          specificTime: enabled.value,
          specificTimes: localRanges.value.map(
            (arr: [Date | null, Date | null]) => [
              formatTime(arr[0]),
              formatTime(arr[1]),
            ]
          ),
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
      // Restore original values and close the editor
      enabled.value = initialEnabled;
      localRanges.value = initialRanges.length
        ? initialRanges.map((r: string[]) => [parseTime(r[0]), parseTime(r[1])])
        : [[null, null]];
      props.params.api.stopEditing(true); // true = cancel editing
    }
    function getValue() {
      if (!enabled.value) return [];
      return localRanges.value.map((arr: [Date | null, Date | null]) => [
        formatTime(arr[0]),
        formatTime(arr[1]),
      ]);
    }

    return {
      enabled,
      localRanges,
      isComplete,
      timeError,
      add,
      remove,
      clear,
      handleOk,
      handleCancel,
      getValue,
    };
  },
});
</script>

<!-- No custom CSS: rely on PrimeVue theme and utility classes for full theme responsiveness -->
