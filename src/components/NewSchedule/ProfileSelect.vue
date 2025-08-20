<template>
  <div class="p-field">
    <div class="custom-input-group">
      <span class="custom-input-group-addon">Profile</span>
      <SelectButton
        id="profile"
        v-model="rootStore.newSchedule.profile"
        :options="profiles"
        @change="
          (rootStore.newSchedule.scheduleTypes = ''),
            (rootStore.selectedFile = null),
            (rootStore.selectedFolder = null)
        "
        class="w-full"
      />
    </div>
    <small
      v-if="!rootStore.newSchedule.profile && attemptedSubmit"
      class="p-error"
    >
      Profile is required.
    </small>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRootStore } from "@/store/RootStore";
import SelectButton from "primevue/selectbutton";

export default defineComponent({
  name: "ProfileSelect",
  components: { SelectButton },
  props: {
    attemptedSubmit: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const rootStore = useRootStore();
    const profiles = computed(() => rootStore.profiles);
    return {
      rootStore,
      profiles,
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
.custom-input-group .p-selectbutton {
  display: flex;
  flex: 1;
  width: 100%;
}

.custom-input-group .p-selectbutton .p-button-group {
  display: flex;
  flex: 1 1 0%;
  width: 100%;
}
.custom-input-group .p-selectbutton .p-button {
  flex: 1;
  width: 100%;
  border-radius: 0;
  box-sizing: border-box;
}
.custom-input-group .p-selectbutton .p-button:not(:last-child) {
  border-right: 1px solid var(--input-border-color, #d1d5db);
}
.custom-input-group .p-selectbutton .p-button:last-child {
  flex: 1 1 0%;
  width: 100%;
}
.p-button {
  flex: 1;
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
