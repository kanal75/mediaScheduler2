<template>
  <Form @submit="submitForm" class="p-fluid w-full px-4 space-y-6">
    <div class="schedule-input">
      <ProfileSelect :attemptedSubmit="attemptedSubmit" />
    </div>
    <div class="schedule-input">
      <ScheduleTypeSelect :attemptedSubmit="attemptedSubmit" />
    </div>
    <div class="schedule-input">
      <DateRangePickerSelect
        ref="dateRangePickerRef"
        :attemptedSubmit="attemptedSubmit"
      />
    </div>
    <div class="schedule-input">
      <SpecificTimesSelect />
    </div>
    <div class="schedule-input">
      <TagsSelect />
    </div>
    <div class="schedule-input">
      <DurationSelect
        v-model="rootStore.newSchedule.metaData.duration"
        :showError="durationError"
      />
    </div>
    <!-- Action Buttons -->
    <div class="p-grid new-schedule-form-actions" style="margin-top: 1.5rem">
      <div class="left-actions">
        <Button
          label="Cancel"
          icon="pi pi-times"
          class="p-button-info"
          @click="cancelForm"
        />
        <Button
          label="Reset"
          icon="pi pi-refresh"
          class="p-button-secondary"
          @click="resetForm"
        />
      </div>
      <div class="right-actions">
        <Button
          label="Add Schedule"
          icon="pi pi-plus"
          @click="submitForm"
          class="p-button-primary"
        />
      </div>
    </div>
  </Form>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import { useRefStore } from "@/store/RefStore";
import { useRootStore } from "@/store/RootStore";
import moment from "moment";
import ProfileSelect from "@/components/NewSchedule/ProfileSelect.vue";
import ScheduleTypeSelect from "@/components/NewSchedule/ScheduleTypeSelect.vue";
import DateRangePickerSelect from "@/components/NewSchedule/DateRangePickerSelect.vue";
import SpecificTimesSelect from "@/components/NewSchedule/SpecificTimesSelect.vue";
import TagsSelect from "@/components/NewSchedule/TagsSelect.vue";
import DurationSelect from "@/components/NewSchedule/DurationSelect.vue";

export default defineComponent({
  name: "NewScheduleForm",
  components: {
    ProfileSelect,
    ScheduleTypeSelect,
    DateRangePickerSelect,
    SpecificTimesSelect,
    TagsSelect,
    DurationSelect,
  },
  setup() {
    const refStore = useRefStore();
    const rootStore = useRootStore();
    const attemptedSubmit = ref(false);
    const dateRangePickerRef = ref();
    const durationError = ref(false);
    // Remove showDurationInput and related logic
    // Set default duration if not present
    watch(
      () => rootStore.newSchedule.scheduleTypes,
      () => {
        if (!rootStore.newSchedule.metaData.duration) {
          rootStore.newSchedule.metaData.duration = "00:00:20:00";
        }
      }
    );
    const isFormValid = computed(() => {
      const { profile, scheduleTypes, timePicker, metaData } =
        rootStore.newSchedule;
      let valid =
        !!profile &&
        !!scheduleTypes &&
        Array.isArray(timePicker) &&
        timePicker.length === 2;
      // Always require duration
      valid =
        valid && /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(metaData.duration || "");
      return valid;
    });
    const submitForm = () => {
      attemptedSubmit.value = true;
      // Always validate duration
      if (
        !/^\d{2}:\d{2}:\d{2}:\d{2}$/.test(
          rootStore.newSchedule.metaData.duration || ""
        )
      ) {
        durationError.value = true;
        return;
      } else {
        durationError.value = false;
      }
      if (isFormValid.value) {
        generateNewScheduleId();
        rootStore.putNewSchedule(rootStore.newSchedule);
        refStore.showNewScheduleDialog = false;
        rootStore.resetNewSchedule();
      }
    };

    const generateNewScheduleId = () => {
      const newScheduleId =
        rootStore.newSchedule.profile +
        "_" +
        rootStore.newSchedule.scheduleTypes +
        "_" +
        moment().format("YYYYMMDDHHmmss");
      rootStore.newSchedule.id = newScheduleId;
    };

    const cancelForm = () => {
      refStore.showNewScheduleDialog = false;
    };

    const resetForm = () => {
      rootStore.resetNewSchedule();
      dateRangePickerRef.value?.clear();
    };

    watch(
      () => rootStore.newSchedule.scheduleTypes,
      (newVal, oldVal) => {
        if (oldVal === "" && newVal && newVal !== "") {
          if (newVal === "System") {
            refStore.showSystemDialog = true;
            refStore.showMediaDialog = false;
          } else {
            refStore.showMediaDialog = true;
            refStore.showSystemDialog = false;
          }
        }
        // Do not show dialog again on deselect
      }
    );

    return {
      refStore,
      rootStore,
      attemptedSubmit,
      isFormValid,
      submitForm,
      cancelForm,
      resetForm,
      dateRangePickerRef,
      durationError,
    };
  },
});
</script>

<style scoped>
.p-error {
  color: #e74c3c;
  font-size: 0.85rem;
}
.p-field {
  margin-bottom: 1.5rem;
}
.font-semibold {
  font-weight: 600;
}
.new-schedule-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.left-actions {
  display: flex;
  gap: 1rem;
}
.right-actions {
  display: flex;
  gap: 1rem;
}
.input-error {
  color: #e74c3c;
  font-size: 0.85em;
  margin-top: 0.25rem;
}
.schedule-input {
  width: 100%;
  box-sizing: border-box;
}
</style>
