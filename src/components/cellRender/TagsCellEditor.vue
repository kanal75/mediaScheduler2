<template>
  <div class="editor-container">
    <v-select
      v-model="selectedTagIds"
      :items="allTagOptions"
      item-title="label"
      item-value="value"
      multiple
      chips
      small-chips
      label="Select Tags"
      class="tag-editor"
    ></v-select>
    <v-btn icon @click="save"><v-icon>mdi-check</v-icon></v-btn>
    <v-btn icon @click="cancel"><v-icon>mdi-close</v-icon></v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";

export default defineComponent({
  name: "TagsCellEditor",
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    // The current value from the cell
    const initialTags = props.params.value || [];
    const selectedTagIds = ref([...initialTags]);

    // Hard-coded or store-driven options:
    const allTagOptions = [
      { label: "Monday", value: "Monday" },
      { label: "Tuesday", value: "Tuesday" },
      { label: "Wednesday", value: "Wednesday" },
      // ...
    ];

    const save = () => {
      // Return new value to AG Grid
      props.params.api.stopEditing();
      props.params.setValue(selectedTagIds.value);
    };

    const cancel = () => {
      // Discard changes
      props.params.api.stopEditing(true);
    };

    onMounted(() => {
      // Focus logic if needed
    });

    return {
      selectedTagIds,
      allTagOptions,
      save,
      cancel,
    };
  },
});
</script>

<style>
.editor-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-editor {
  min-width: 150px;
}
</style>
