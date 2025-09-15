<template>
  <div>
    <div class="context-header">
      <div class="context-field">
        <strong>Date:</strong>
        {{ context.date }}
      </div>
      <div class="context-field">
        <strong>Track:</strong>
        {{ context.track }}
      </div>
      <div class="context-field">
        <strong>Bet Type:</strong>
        {{ context.betType }}
      </div>
      <div class="context-field flex-1">
        <InputText
          v-model="editable.title"
          placeholder="Title"
          style="width: 100%"
        />
      </div>
    </div>
    <div v-for="(leg, i) in editable.legs" :key="i" class="p-mb-3">
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
            <span>
              {{ currentProfile === "ASR" ? "All Horses" : "Alla Hästar" }}
            </span>
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
        <Button label="Cancel" class="p-button-info" @click="$emit('cancel')">
          <template #icon>
            <Icon name="times" />
          </template>
        </Button>
      </div>
      <div class="right-actions">
        <Button label="Save" @click="onSave" class="p-mr-2">
          <template #icon>
            <Icon name="save" />
          </template>
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, PropType } from "vue";
import { useSystemStore } from "@/store/SystemStore";
import { useRootStore } from "@/store/RootStore";
import type { SystemFormModel } from "@/types";
import InputText from "primevue/inputtext";
import Divider from "primevue/divider";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import Icon from "@/components/icons/Icon.vue";

export default defineComponent({
  name: "SystemEdit",
  components: { InputText, Divider, Checkbox, Button, Icon },
  props: {
    modelValue: { type: Object as PropType<SystemFormModel>, required: true },
    profile: { type: String, required: true },
  },
  emits: ["update:modelValue", "save", "cancel"],
  setup(props, { emit }) {
    const rootStore = useRootStore();
    const systemStore = useSystemStore();

    const editable = ref<SystemFormModel>({
      title: props.modelValue.title || "",
      date: props.modelValue.date || "",
      track: props.modelValue.track || "",
      betType: props.modelValue.betType || "",
      legs: JSON.parse(JSON.stringify(props.modelValue.legs || [])),
      path: props.modelValue.path || "",
      location: props.modelValue.location || "",
    });

    watch(
      () => props.modelValue,
      (val) => {
        editable.value = {
          title: val.title || "",
          date: val.date || "",
          track: val.track || "",
          betType: val.betType || "",
          legs: JSON.parse(JSON.stringify(val.legs || [])),
          path: val.path || "",
          location: val.location || "",
        };
      },
      { deep: true }
    );

    const options = systemStore.options;
    const checkAll = systemStore.checkAll;
    const checkAllChecked = systemStore.checkAllChecked;

    const currentProfile = computed(function () {
      return props.profile || rootStore.newSchedule.profile || "";
    });
    const context = computed(() => ({
      date: editable.value.date,
      track: editable.value.track,
      betType: editable.value.betType,
    }));

    function getHorseName(horseNumber: string | null, legIndex: number) {
      const leg = editable.value.legs[legIndex];
      if (leg.isAllChecked || horseNumber === null) {
        return currentProfile.value === "ASR" ? "All Horses" : "Alla Hästar";
      }
      const horse = leg.starts.find((start) => start.hnr === horseNumber);
      return horse ? horse.hName : "";
    }

    function onSave() {
      emit("update:modelValue", editable.value);
      emit("save", editable.value);
    }

    return {
      rootStore,
      systemStore,
      editable,
      context,
      options,
      checkAll,
      checkAllChecked,
      getHorseName,
      currentProfile,
      onSave,
    };
  },
});
</script>

<style scoped>
.context-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}
.context-field {
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
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
</style>
