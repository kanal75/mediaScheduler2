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
        :showError="durationError && !durationValid"
      />
    </div>
    <!-- Action Buttons -->
    <div class="p-grid new-schedule-form-actions" style="margin-top: 1.5rem">
      <div class="left-actions">
        <Button label="Cancel" class="p-button-info" @click="cancelForm">
          <template #icon>
            <Icon name="times" />
          </template>
        </Button>
        <Button label="Reset" class="p-button-secondary" @click="resetForm">
          <template #icon>
            <Icon name="refresh" />
          </template>
        </Button>
      </div>
      <div class="right-actions">
        <Button
          label="Add Schedule"
          @click="submitForm"
          class="p-button-primary"
        >
          <template #icon>
            <Icon name="plus" />
          </template>
        </Button>
      </div>
    </div>
  </Form>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import { useRefStore } from "@/store/RefStore";
import { useRootStore } from "@/store/RootStore";
import { useNotificationStore } from "@/store/NotificationStore";
import dayjs from "dayjs";
import ProfileSelect from "@/components/NewSchedule/ProfileSelect.vue";
import ScheduleTypeSelect from "@/components/NewSchedule/ScheduleTypeSelect.vue";
import DateRangePickerSelect from "@/components/NewSchedule/DateRangePickerSelect.vue";
import SpecificTimesSelect from "@/components/NewSchedule/SpecificTimesSelect.vue";
import TagsSelect from "@/components/NewSchedule/TagsSelect.vue";
import DurationSelect from "@/components/NewSchedule/DurationSelect.vue";
import Icon from "@/components/icons/Icon.vue";

export default defineComponent({
  name: "NewScheduleForm",
  components: {
    ProfileSelect,
    ScheduleTypeSelect,
    DateRangePickerSelect,
    SpecificTimesSelect,
    TagsSelect,
    DurationSelect,
    Icon,
  },
  setup() {
    const refStore = useRefStore();
    const rootStore = useRootStore();
    const notificationStore = useNotificationStore();
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
    // Duration validity derived from model (treat clip/music as valid automatically)
    const durationValid = computed(() => {
      const t = (rootStore.newSchedule.scheduleTypes || "").toLowerCase();
      if (t === "clip" || t === "music") return true;
      const val = rootStore.newSchedule.metaData.duration || "";
      return /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(val);
    });

    const isFormValid = computed(() => {
      const { profile, scheduleTypes, timePicker } = rootStore.newSchedule;
      let valid =
        !!profile &&
        !!scheduleTypes &&
        Array.isArray(timePicker) &&
        timePicker.length === 2;
      // Require duration via computed validity (handles clip/music)
      valid = valid && durationValid.value;
      return valid;
    });

    const submitForm = () => {
      attemptedSubmit.value = true;
      // Always validate duration (unless clip/music which is covered in durationValid)
      if (!durationValid.value) {
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
      } else {
        // Build a concise message about missing fields
        const ns = rootStore.newSchedule;
        const missing: string[] = [];
        if (!ns.profile) missing.push("Profile");
        if (!ns.scheduleTypes) missing.push("Type");
        if (!Array.isArray(ns.timePicker) || ns.timePicker.length !== 2)
          missing.push("Date range");
        if (!durationValid.value) missing.push("Duration");
        notificationStore.showToast({
          severity: "warn",
          summary: "Form incomplete",
          detail:
            missing.length > 0
              ? `Please fill: ${missing.join(", ")}.`
              : "Form is not valid.",
          life: 3000,
        });
      }
    };

    // Auto-clear durationError when value becomes valid
    watch(
      () => rootStore.newSchedule.metaData.duration,
      () => {
        if (durationValid.value) {
          durationError.value = false;
        }
      }
    );

    const generateNewScheduleId = () => {
      const newScheduleId =
        rootStore.newSchedule.profile +
        "_" +
        rootStore.newSchedule.scheduleTypes +
        "_" +
        dayjs().format("YYYYMMDDHHmmss");
      rootStore.newSchedule.id = newScheduleId;
    };

    const cancelForm = () => {
      refStore.showNewScheduleDialog = false;
    };

    const resetForm = () => {
      rootStore.resetNewSchedule();
      dateRangePickerRef.value?.clear();
    };

    // NewScheduleDialog is now responsible for opening/closing media/system dialogs.

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
      durationValid,
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
