<template>
  <div class="p-field">
    <div class="custom-input-group">
      <span class="custom-input-group-addon">Profile</span>
      <SelectButton
        id="profile"
        v-model="rootStore.newSchedule.profile"
        :options="profiles"
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
import { defineComponent, computed, watch } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useMediaStore } from "@/store/MediaStore";
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
    const mediaStore = useMediaStore();
    const profiles = computed(() => rootStore.profiles);
    // Only clear schedule type / selected media when the profile actually
    // changes. PrimeVue's SelectButton can emit change events even if the
    // underlying model doesn't change in some interactions, so using a
    // watch with old/new comparison avoids accidental clears.
    watch(
      () => rootStore.newSchedule.profile,
      (newVal: string, oldVal: string) => {
        if (newVal && oldVal && newVal !== oldVal) {
          rootStore.newSchedule.scheduleTypes = "";
          mediaStore.resetAll();
        }
      }
    );
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
  color: inherit;
  background-color: transparent;
  font-weight: inherit;
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
