<template>
  <div class="p-field">
    <div class="custom-input-group">
      <span class="custom-input-group-addon">Date</span>
      <DatePicker
        ref="dp"
        v-model="localRange"
        selectionMode="range"
        showTime
        :closeOnDateSelect="false"
        class="w-full"
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
import { defineComponent } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useDateRangePicker } from "@/components/composables/useDateRangePicker";
import DatePicker from "primevue/datepicker";

export default defineComponent({
  name: "DateRangePickerSelect",
  components: { DatePicker },
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
    } = useDateRangePicker({
      initialRange: rootStore.newSchedule.timePicker,
      onChange: (range: string[]) => {
        rootStore.newSchedule.timePicker = range;
      },
    });

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
      rootStore,
      props,
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
  color: var(--input-group-addon-color, var(--el-text-color-regular, #ffffff));
  font-weight: 500;
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
</style>
