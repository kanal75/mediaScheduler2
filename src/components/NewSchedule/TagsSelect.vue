<template>
  <div class="p-field">
    <div class="custom-input-group">
      <span class="custom-input-group-addon">Tags</span>
      <div class="custom-input-group-content">
        <MultiSelect
          id="tags"
          v-model="rootStore.newSchedule.scheduleTags"
          :options="groupedTagOptions"
          display="chip"
          class="w-full"
          filter
          optionGroupLabel="label"
          optionGroupChildren="items"
          optionLabel="label"
          optionValue="value"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRootStore } from "@/store/RootStore";

export default defineComponent({
  name: "TagsSelect",
  setup() {
    const rootStore = useRootStore();
    const groupedTagOptions = computed(() =>
      rootStore.scheduleTagsGroups.map((group) => ({
        label: group.Id,
        items: (Array.isArray(group.Tag)
          ? group.Tag
          : group.Tag
          ? [group.Tag]
          : []
        ).map((tag) => ({
          label: tag.Id,
          value: tag.Id,
        })),
      }))
    );
    return {
      rootStore,
      groupedTagOptions,
    };
  },
});
</script>

<style scoped>
.font-semibold {
  font-weight: 600;
}
.p-field {
  margin: 0;
  padding: 0;
}
.custom-input-group {
  display: flex;
  align-items: stretch;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  margin: 0;
  padding-top: 0;
  padding-bottom: 0;
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
.custom-input-group-content {
  flex: 1 1 0%;
  min-width: 0;
  border: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  padding: 0;
  height: 100%;
}
.custom-input-group-content .w-full {
  width: 100% !important;
  flex: 1 1 0%;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
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
  height: 52px;
  box-sizing: border-box;
}
</style>
