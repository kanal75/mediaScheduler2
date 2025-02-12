<template>
  <div class="tags-cell">
    <v-chip
      v-for="(tag, i) in tags"
      :key="i"
      label
      small
      class="ma-1"
      color="primary"
      text-color="white"
    >
      <v-icon icon="mdi-label" start></v-icon>
      {{ tag }}
    </v-chip>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "TagsCell",
  props: {
    params: { type: Object, required: true },
  },
  setup(props) {
    const tags = computed(() => {
      const value = props.params.value;
      return Array.isArray(value) ? value : [];
    });

    return { tags };
  },
});
</script>

<style>
.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
</style>
