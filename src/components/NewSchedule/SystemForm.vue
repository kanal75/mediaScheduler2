<template>
  <div>
    <Form
      @submit.prevent="onSubmit"
      :model="system"
      :rules="rules"
      ref="systemForm"
      class="p-fluid"
    >
      <div
        class="p-grid p-formgrid"
        style="display: flex; flex-wrap: wrap; gap: 1rem"
      >
        <div style="flex: 1 1 0; min-width: 0">
          <Calendar
            v-model="calendarDate"
            dateFormat="yy-mm-dd"
            :manualInput="false"
            placeholder="Select Date"
            showIcon
            @date-select="onDateChange"
            :inputStyle="{ width: '100%' }"
          />
          <div v-if="showErrors && !system.date" class="input-error">
            Date is required.
          </div>
        </div>
        <div style="flex: 1 1 0; min-width: 0">
          <Select
            v-model="system.track"
            :options="dayTracks"
            optionLabel="label"
            optionValue="value"
            placeholder="Select Track"
            @change="getTrackBetTypes"
            :style="{ width: '100%' }"
          />
          <div v-if="showErrors && !system.track" class="input-error">
            Track is required.
          </div>
        </div>
        <div style="flex: 1 1 0; min-width: 0">
          <Select
            v-model="system.betType"
            :options="trackBetTypes"
            optionLabel="id"
            optionValue="id"
            placeholder="Select Bet Type"
            @change="getBetForms"
            :style="{ width: '100%' }"
          />
          <div v-if="showErrors && !system.betType" class="input-error">
            Bet Type is required.
          </div>
        </div>
        <div style="flex: 1 1 0; min-width: 0">
          <InputText
            v-model="system.title"
            placeholder="Title"
            style="width: 100%"
          />
          <div v-if="showErrors && !system.title" class="input-error">
            Title is required.
          </div>
        </div>
      </div>
      <div v-for="(leg, i) in system.legs" :key="i" class="p-mb-3">
        <Divider align="left">{{ leg.fullName }}</Divider>
        <div class="leg-row">
          <div class="checkbox-group">
            <div style="display: inline-flex; align-items: center">
              <Checkbox
                v-model="leg.isAllChecked"
                :binary="true"
                @change="() => checkAll(leg)"
                :indeterminate="leg.indeterminate && !leg.isAllChecked"
                class="all-checkbox"
              />
              <span class="checkbox-label">All</span>
            </div>
            <div
              v-for="option in options(leg.starts)"
              :key="option.value"
              style="display: inline-flex; align-items: center"
            >
              <Checkbox
                :inputId="`cb-${i}-${option.value}`"
                :value="option.value"
                v-model="leg.checked"
                :disabled="option.disabled"
                class="horse-checkbox"
                @change="() => checkAllChecked(leg)"
              />
              <span class="checkbox-label">{{ option.label }}</span>
            </div>
          </div>
          <span style="flex: 1 1 auto"></span>
          <div class="leg-input">
            <template v-if="leg.isAllChecked">
              <span>{{
                rootStore.newSchedule.profile === "ASR"
                  ? "All Horses"
                  : "Alla Hästar"
              }}</span>
            </template>
            <template v-else-if="leg.checked.length === 1">
              <span>{{ getHorseName(leg.checked[0], i) }}</span>
            </template>
            <template v-else>
              <InputText v-model="leg.textInput" class="leg-row-input" />
            </template>
          </div>
        </div>
      </div>
      <div class="p-grid system-form-actions" style="margin-top: 1.5rem">
        <div class="left-actions">
          <Button label="Cancel" class="p-button-info" @click="onCancel">
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
          <Button label="Add System" @click="onSubmit" class="p-mr-2">
            <template #icon>
              <Icon name="plus" />
            </template>
          </Button>
        </div>
      </div>
    </Form>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from "vue";
import { useSystemStore } from "@/store/SystemStore";
import { useRootStore } from "@/store/RootStore";
import { useRefStore } from "@/store/RefStore";
import type { Leg } from "../../types";
import dayjs from "dayjs";
import Form from "@primevue/forms/form";
import Calendar from "primevue/calendar";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Divider from "primevue/divider";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import Icon from "@/components/icons/Icon.vue";

export default defineComponent({
  name: "SystemForm",
  components: {
    Form,
    Calendar,
    Select,
    InputText,
    Divider,
    Checkbox,
    Button,
    Icon,
  },
  setup() {
    const systemStore = useSystemStore();
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const system = systemStore.system;
    // PrimeVue Calendar expects a Date; keep a local Date ref and sync to store's YYYY-MM-DD string
    const calendarDate = ref<Date | null>(
      system.date ? dayjs(system.date).toDate() : null
    );
    const dayTracks = computed(() =>
      systemStore.dayTracks.map((t) => ({ label: t, value: t }))
    );
    const trackBetTypes = computed(() => systemStore.trackBetTypes);

    const rules = {
      title: [
        {
          required: true,
          message: "Please write system title!",
          trigger: "blur",
        },
      ],
      date: [
        { required: true, message: "Please select a date!", trigger: "blur" },
      ],
      track: [
        { required: true, message: "Please select a track!", trigger: "blur" },
      ],
      betType: [
        {
          required: true,
          message: "Please select a bet type!",
          trigger: "blur",
        },
      ],
    };

    const getDayTracks = systemStore.getDayTracks;
    const getTrackBetTypes = systemStore.getTrackBetTypes;
    const getBetForms = systemStore.getBetForms;
    const resetForm = systemStore.resetForm;
    const options = systemStore.options;
    const checkAll = systemStore.checkAll;
    const checkAllChecked = systemStore.checkAllChecked;

    const showErrors = ref(false);

    function getHorseName(horseNumber: string | null, legIndex: number) {
      const leg = system.legs[legIndex];
      if (leg.isAllChecked || horseNumber === null) {
        return rootStore.newSchedule.profile === "ASR"
          ? "All Horses"
          : "Alla Hästar";
      }
      const horse = leg.starts.find((start) => start.hnr === horseNumber);
      return horse ? horse.hName : "";
    }

    function onCancel() {
      refStore.showSystemDialog = false;
    }

    function generateSystemPaths() {
      const profile = rootStore.newSchedule.profile;
      const scheduleTypes = rootStore.newSchedule.scheduleTypes;
      const date = system.date;
      const track = system.track;
      const betType = system.betType;
      const timeStr = dayjs().format("HHmmss");
      const fileName = `${profile}_System_${date}_${track}_${betType}_${timeStr}.png`;
      const path = `http://10.200.35.111/data/Storage/Production/Media_Scheduler/${profile}/${scheduleTypes}/${fileName}`;
      const location = `\\onair.vast.k75-core.local\\data\\Storage\\Production\\Media_Scheduler\\${profile}\\${scheduleTypes}\\${fileName}`;
      return { path, location };
    }

    function onSubmit() {
      showErrors.value = true;
      if (!system.title || !system.date || !system.track || !system.betType) {
        return;
      }
      const { path, location } = generateSystemPaths();
      system.path = path;
      system.location = location;
      rootStore.newSchedule.metaData = {
        ...rootStore.newSchedule.metaData,
        ...system,
      };

      const transformedData = {
        location: location,
        text: system.title,
        width: 1920,
        height: 1080,
        bettype: system.betType,
        rows: (system.legs || []).map((leg: Leg, legIndex: number) => ({
          horses: leg.isAllChecked ? [] : leg.checked.map(Number),
          text: leg.isAllChecked
            ? rootStore.newSchedule.profile === "ASR"
              ? "All Horses"
              : "Alla Hästar"
            : leg.checked.length === 1
            ? getHorseName(leg.checked[0], legIndex)
            : leg.textInput || "",
        })),
      };
      systemStore.createPNG(transformedData);
      refStore.showSystemDialog = false;
    }

    function onDateChange(date: Date) {
      // Keep local Date in sync and format to yyyy-MM-dd for backend
      calendarDate.value = date;
      system.date = dayjs(date).format("YYYY-MM-DD");
      getDayTracks();
    }

    // Also watch manual clears (if any) to keep system.date consistent
    watch(calendarDate, (val) => {
      if (!val) {
        system.date = "";
      }
    });

    return {
      system,
      calendarDate,
      rules,
      dayTracks,
      trackBetTypes,
      getDayTracks,
      getTrackBetTypes,
      getBetForms,
      resetForm,
      options,
      checkAll,
      checkAllChecked,
      showErrors,
      getHorseName,
      onCancel,
      onSubmit,
      onDateChange,
      rootStore,
      refStore,
    };
  },
});
</script>

<style scoped>
.p-formgrid .p-col-12 {
  margin-bottom: 1rem;
}
.leg-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: nowrap;
  margin-bottom: 1rem;
  background: transparent;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  min-height: 56px;
  height: auto;
}
.all-checkbox {
  margin-right: 0.2rem;
  font-weight: bold;
}
.checkbox-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  position: static;
  left: unset;
  top: unset;
  transform: none;
  flex: 0 1 auto;
}
.horse-checkbox {
  margin-right: 0.25rem;
}
.leg-input {
  min-width: 200px;
  max-width: 360px;
  width: 360px;
  display: flex;
  justify-content: flex-end;
  flex: 0 0 360px;
}
.leg-row-input {
  width: 100%;
  min-width: 200px;
  max-width: 400px;
  text-align: right;
  box-sizing: border-box;
  margin-left: 0;
}
.p-grid .p-col-12 .p-mr-2 {
  margin-right: 1rem !important;
}
.checkbox-label {
  margin-right: 1.2rem;
  margin-left: 0.2rem;
  font-size: 0.95em;
  user-select: none;
}
.checkbox-group > div:first-child .checkbox-label {
  margin-right: 1.8rem;
  font-size: 1.08em;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.p-datepicker {
  min-width: 0;
  max-width: none;
  width: 100%;
  box-sizing: border-box;
}
.system-form-actions {
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
  font-size: 0.95em;
  margin-top: 0.25rem;
}
</style>
