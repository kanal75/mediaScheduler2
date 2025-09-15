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
        </MultiSelect>
        <div class="p-inputgroup ml-2" style="flex: 1; max-width: 260px">
          <InputText
            v-model="newTag"
            placeholder="Add custom tag"
            @keyup.enter="addCustomTag"
            style="width: 100%; padding-right: 2.5rem"
          />
          <Button
            @click="addCustomTag"
            class="input-btn-inside"
            :disabled="!newTag.trim()"
            style="
              position: absolute;
              right: 8px;
              top: 50%;
              transform: translateY(-50%);
              height: 32px;
              width: 32px;
              padding: 0;
              min-width: 0;
            "
            tabindex="-1"
          >
            <template #icon>
              <Icon name="plus" />
            </template>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useRootStore } from "@/store/RootStore";
import MultiSelect from "primevue/multiselect";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Icon from "@/components/icons/Icon.vue";

export default defineComponent({
  name: "TagsSelect",
  components: { MultiSelect, InputText, Button, Icon },
  setup() {
    const rootStore = useRootStore();

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

      // 'My Tags' first if present, then others
      return [...myTagsOption, ...otherOptions];
    });

    const newTag = ref("");

    const addCustomTag = async () => {
      if (!newTag.value.trim()) return;
      const customTag = newTag.value.trim();
      const tagObj = {
        Id: customTag,
        BSKEY: customTag,
        bonsaiXmlDB: { addTimestamp: new Date().toISOString() },
      };
      await rootStore.pushTagToGroup("My Tags", tagObj);
      // Optionally select the newly added tag in the current form
      const currentTags = Array.isArray(rootStore.newSchedule.scheduleTags)
        ? rootStore.newSchedule.scheduleTags
        : [];
      if (!currentTags.includes(customTag)) {
        rootStore.newSchedule.scheduleTags = [...currentTags, customTag];
      }
      newTag.value = "";
    };

    interface TagOption {
      label: string;
      value: string;
    }
    interface TagGroup {
      label: string;
      items: TagOption[];
    }

    // Add this method inside setup()
    const onDeleteTag = async (option: TagOption) => {
      // Find the group label for this option
      const group = (groupedTagOptions.value as TagGroup[]).find((g) =>
        g.items.some((item) => item.value === option.value)
      );
      const groupId = group?.label;
      const tagId = option.value;
      if (groupId && tagId) {
        await rootStore.deleteTagFromGroup(groupId, tagId);
      }
    };

    // Helper to get group label for a tag option
    const getGroupLabelForOption = (option: TagOption): string | undefined => {
      const group = (groupedTagOptions.value as TagGroup[]).find((g) =>
        g.items.some((item) => item.value === option.value)
      );
      return group?.label;
    };

    return {
      rootStore,
      groupedTagOptions,
      newTag,
      addCustomTag,
      onDeleteTag,
      getGroupLabelForOption,
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
.p-inputgroup {
  position: relative;
  width: 100%;
}
.input-btn-inside {
  background: #1976d2;
  color: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(25, 118, 210, 0.08);
  border: none;
  transition: background 0.2s;
  z-index: 2;
}
.input-btn-inside:disabled {
  background: #e0e0e0;
  color: #bdbdbd;
  cursor: not-allowed;
}
.tag-trash-icon:hover {
  color: #b71c1c;
}
</style>
