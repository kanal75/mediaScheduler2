<template>
  <div class="editor-container tag-editor-margin">
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
        style="margin-bottom: 16px"
      >
        <template #option="slotProps">
          <div
            class="tag-option-row"
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;
            "
          >
            <span>{{ slotProps.option.label }}</span>
            <span
              v-if="
                slotProps.option &&
                getGroupLabelForOption(slotProps.option) === 'My Tags'
              "
              class="tag-trash-icon"
              style="margin-left: 8px; cursor: pointer"
              @click.stop="onDeleteTag(slotProps.option)"
              title="Delete tag"
            >
              <Icon name="trash" />
            </span>
          </div>
        </template>
        <template #footer>
          <div
            style="
              display: flex;
              flex-direction: column;
              gap: 16px;
              width: 100%;
            "
          >
            <div
              style="
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
              "
            >
              <InputText
                v-model="newTag"
                placeholder="Add custom tag"
                @keyup.enter="addCustomTag"
                style="flex: 1; padding: 8px 16px; margin-right: 8px"
              />
              <Button
                @click="addCustomTag"
                class="input-btn-inside"
                :disabled="!newTag.trim()"
                style="height: 32px; width: 32px; padding: 0; min-width: 0"
                tabindex="-1"
              >
                <template #icon>
                  <Icon name="plus" />
                </template>
              </Button>
            </div>
            <div
              style="
                display: flex;
                justify-content: flex-end;
                width: 100%;
                margin-top: 8px;
              "
            >
              <Button class="p-button-sm" label="OK" @click="okAndClose" />
            </div>
          </div>
        </template>
      </MultiSelect>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRootStore } from "@/store/RootStore";
import MultiSelect from "primevue/multiselect";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import type { Tag } from "@/types";
import Icon from "@/components/icons/Icon.vue";

export default defineComponent({
  name: "TagsCellEditor",
  components: { MultiSelect, Button, InputText, Icon },
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const rootStore = useRootStore();
    const initialTags: string[] = props.params.value || [];
    const selectedTagIds = ref([...initialTags]);
    const multiSelectRef = ref<InstanceType<typeof MultiSelect> | null>(null);
    const newTag = ref("");

    // Grouped options for MultiSelect
    const groupedTagOptions = computed(() => {
      // Separate 'My Tags' group and others
      const myTagsGroup = rootStore.scheduleTagsGroups.find(
        (group) => group.Id === "My Tags"
      );
      const otherGroups = rootStore.scheduleTagsGroups.filter(
        (group) => group.Id !== "My Tags"
      );

      // Only include 'My Tags' if it has tags
      const myTagsOption =
        myTagsGroup &&
        Array.isArray(myTagsGroup.Tag) &&
        myTagsGroup.Tag.length > 0
          ? [
              {
                label: myTagsGroup.Id,
                items: myTagsGroup.Tag.map((tag) => ({
                  label: tag.Id,
                  value: tag.Id,
                })),
              },
            ]
          : [];

      // Map other groups as before
      const otherOptions = otherGroups.map((group) => ({
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
      }));

      // 'My Tags' last if present, others first
      return [...otherOptions, ...myTagsOption];
    });

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

    interface TagOption {
      label: string;
      value: string;
    }
    interface TagGroup {
      label: string;
      items: TagOption[];
    }
    const getGroupLabelForOption = (option: TagOption): string | undefined => {
      const group = (groupedTagOptions.value as TagGroup[]).find((g) =>
        g.items.some((item) => item.value === option.value)
      );
      return group?.label;
    };
    const addCustomTag = async () => {
      if (newTag.value.trim()) {
        const customTag = newTag.value.trim();
        const tagObj: Tag = {
          Id: customTag,
          BSKEY: customTag,
          bonsaiXmlDB: { addTimestamp: new Date().toISOString() },
        };
        // Find the "My Tags" group
        const myTagsGroup = rootStore.scheduleTagsGroups.find(
          (group) => group.Id === "My Tags"
        );
        if (myTagsGroup) {
          await rootStore.pushTagToGroup("My Tags", tagObj);
        } else {
          rootStore.scheduleTagsGroups.push({
            Id: "My Tags",
            BSKEY: "My Tags",
            Tag: [tagObj],
          });
        }
        newTag.value = "";
      }
    };
    const onDeleteTag = async (option: TagOption) => {
      const group = (groupedTagOptions.value as TagGroup[]).find((g) =>
        g.items.some((item) => item.value === option.value)
      );
      const groupId = group?.label;
      const tagId = option.value;
      if (groupId && tagId) {
        await rootStore.deleteTagFromGroup(groupId, tagId);
      }
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
      newTag,
      addCustomTag,
      onDeleteTag,
      getGroupLabelForOption,
    };
  },
});
</script>

<style scoped>
.tag-option-row {
  padding: 0.5rem 1rem;
}

.tag-trash-icon {
  margin-left: 8px;
  color: #e53935;
  cursor: pointer;
  font-size: 1rem;
}

.tag-editor-margin {
  margin-left: 16px;
  margin-right: 16px;
}
</style>
