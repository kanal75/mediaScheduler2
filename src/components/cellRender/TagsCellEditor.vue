<template>
  <div class="editor-container">
    <div style="display: flex; align-items: center; width: 100%">
      <MultiSelect
        v-model="selectedTagIds"
        :options="groupedTagOptions"
        display="chip"
        placeholder="Select Tags"
        class="w-full"
        filter
        optionGroupLabel="label"
        optionGroupChildren="items"
        optionLabel="label"
        optionValue="value"
        ref="multiSelectRef"
      >
        <template #footer>
          <div style="display: flex; justify-content: flex-end; width: 100%">
            <Button class="p-button-sm" label="OK" @click="okAndClose" />
          </div>
        </template>
      </MultiSelect>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRootStore } from "@/store/RootStore";
import type { Group, Tag } from "@/types";

export default defineComponent({
  name: "TagsCellEditor",
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const rootStore = useRootStore();
    const initialTags: string[] = props.params.value || [];
    const selectedTagIds = ref([...initialTags]);
    const multiSelectRef = ref<any>(null);

    // Grouped options for MultiSelect
    const groupedTagOptions = computed(() =>
      rootStore.scheduleTagsGroups.map((group: Group) => ({
        label: group.Id,
        items: (Array.isArray(group.Tag)
          ? group.Tag
          : group.Tag
          ? [group.Tag]
          : []
        ).map((tag: Tag) => ({
          label: tag.Id,
          value: tag.Id,
        })),
      }))
    );

    const save = () => {
      props.params.api.stopEditing();
    };
    const cancel = () => {
      props.params.api.stopEditing(true);
    };
    const getValue = () => {
      // Persist the updated tags to the backend
      rootStore.upsertSchedule({
        ...props.params.data,
        scheduleTags: selectedTagIds.value,
      });
      return selectedTagIds.value;
    };

    const closeMultiSelect = () => {
      if (multiSelectRef.value) {
        multiSelectRef.value.hide();
      }
    };

    const okAndClose = () => {
      if (multiSelectRef.value) {
        multiSelectRef.value.hide();
      }
      // Also close the editing mode
      props.params.api.stopEditing();
    };

    return {
      selectedTagIds,
      groupedTagOptions,
      save,
      cancel,
      getValue,
      multiSelectRef,
      closeMultiSelect,
      okAndClose,
    };
  },
});
</script>
