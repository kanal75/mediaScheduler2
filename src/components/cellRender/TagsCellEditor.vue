<template>
  <div class="editor-container tag-editor-margin">
    <div style="display: flex; align-items: center; width: 100%">
      <MultiSelect
        v-model="selectedTagIds"
        :options="groupedTagOptions"
        display="chip"
        placeholder="Select Tags"
        class="w-full tags-ms"
        filter
        appendTo="body"
        :panelClass="'tags-panel'"
        :panelStyle="{ maxHeight: '65vh', zIndex: 9999 }"
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
          <div class="add-tag-container">
            <div class="p-multiselect-filter-container add-tag-filter">
              <InputText
                v-model="newTag"
                placeholder="Add custom tag"
                @keyup.enter="addCustomTag"
                class="add-tag-input"
              />
              <button
                class="add-tag-plus"
                @click="addCustomTag"
                :disabled="!newTag.trim()"
                type="button"
                tabindex="-1"
                aria-label="Add tag"
                title="Add tag"
              >
                <Icon name="plus" />
              </button>
            </div>
            <div class="add-ok-row">
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
    // Track newly added tags locally so they stay at the top briefly
    const recentlyAddedIds = ref<string[]>([]);

    // Grouped options for MultiSelect
    const groupedTagOptions = computed(() => {
      // Separate 'My Tags' group and others
      const myTagsGroup = rootStore.scheduleTagsGroups.find(
        (group) => group.Id === "My Tags"
      );
      const otherGroups = rootStore.scheduleTagsGroups.filter(
        (group) => group.Id !== "My Tags"
      );

      // Helper: normalize Tag | Tag[] | undefined to Tag[]
      const toArray = (tagField: Tag | Tag[] | undefined): Tag[] =>
        Array.isArray(tagField) ? tagField : tagField ? [tagField] : [];
      const isRecentlyAdded = (id: string) =>
        recentlyAddedIds.value.includes(id);
      // Helper: sort with priority: recently added first, then by addTimestamp desc, then by label asc
      const sortByCreatedDesc = (a: Tag, b: Tag) => {
        const aRecent = isRecentlyAdded(a.Id);
        const bRecent = isRecentlyAdded(b.Id);
        if (aRecent !== bRecent) return aRecent ? -1 : 1;
        const at = Date.parse(a.bonsaiXmlDB?.addTimestamp || "");
        const bt = Date.parse(b.bonsaiXmlDB?.addTimestamp || "");
        const aTime = Number.isFinite(at) ? at : 0;
        const bTime = Number.isFinite(bt) ? bt : 0;
        if (bTime !== aTime) return bTime - aTime;
        return String(a.Id).localeCompare(String(b.Id));
      };

      // Only include 'My Tags' if it has tags
      const myTagsOption =
        myTagsGroup && toArray(myTagsGroup.Tag).length > 0
          ? [
              {
                label: myTagsGroup.Id,
                items: toArray(myTagsGroup.Tag)
                  .slice()
                  .sort(sortByCreatedDesc)
                  .map((tag) => ({
                    label: tag.Id,
                    value: tag.Id,
                  })),
              },
            ]
          : [];

      // Map other groups as before
      const otherOptions = otherGroups.map((group) => ({
        label: group.Id,
        items: toArray(group.Tag).map((tag) => ({
          label: tag.Id,
          value: tag.Id,
        })),
      }));

      // 'My Tags' first if present, followed by other groups
      return [...myTagsOption, ...otherOptions];
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
        // Mark as recently added so it stays at the top even if timestamp is missing in a refresh
        if (!recentlyAddedIds.value.includes(customTag)) {
          recentlyAddedIds.value = [...recentlyAddedIds.value, customTag];
        }
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

/* Make the MultiSelect dropdown panel taller and reorder using CSS Grid */
:deep(.p-multiselect-panel) {
  max-height: 70vh;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
}
/* Row 1: our footer (Add custom tag + plus) ABOVE the search */
:deep(.p-multiselect-footer) {
  grid-row: 1;
  padding: 8px 12px;
  border-bottom: 1px solid var(--surface-border, rgba(255, 255, 255, 0.08));
}
/* Row 2: header (search) */
:deep(.p-multiselect-header) {
  grid-row: 2;
}
/* Row 3: scrollable items */
:deep(.p-multiselect-items-wrapper) {
  grid-row: 3;
  min-height: 0; /* allow grid child to shrink */
  overflow: auto;
}
</style>

<!-- Global styles for the portal-appended panel (appended to body) -->
<style>
/* Target only this MultiSelect via panelClass */
/* Some PrimeVue versions apply panelClass to the wrapper, others to the panel. Support both. */
.tags-panel,
.tags-panel.p-multiselect-panel,
.tags-panel .p-multiselect-panel {
  max-height: 70vh;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
}
.tags-panel .p-multiselect-footer {
  grid-row: 1;
  padding: 8px 12px;
  border-bottom: 1px solid var(--surface-border, rgba(255, 255, 255, 0.08));
}
.tags-panel .p-multiselect-header {
  grid-row: 2;
}
.tags-panel .p-multiselect-items-wrapper {
  grid-row: 3;
  min-height: 0;
  overflow: auto;
}
/* Add-tag section styled like the search field */
.tags-panel .add-tag-container {
  padding-top: 0.25rem;
}
.tags-panel .add-tag-filter {
  position: relative;
  margin: 0.5rem 0.75rem; /* match search spacing */
}
.tags-panel .add-tag-input.p-inputtext {
  width: 100%;
  padding-right: 2.25rem; /* leave room for plus icon */
}
.tags-panel .add-tag-plus {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.tags-panel .add-tag-plus:disabled {
  opacity: 0.5;
  cursor: default;
}
.tags-panel .add-ok-row {
  display: flex;
  justify-content: flex-end;
  padding: 0 0.75rem 0.5rem;
}
</style>
