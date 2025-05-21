<template>
  <div class="tags-cell">
    <Tag
      v-for="(tag, i) in tags"
      :key="i"
      :value="tag"
      class="ma-1"
      severity="info"
    />
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

.tags-cell .ma-1 {
  margin: 2px;
  padding-top: 0px;
  padding-bottom: 0px;
}

.tags-cell .p-tag {
  padding-top: 1px;
  padding-bottom: 1px;
  line-height: 1.2;
  font-size: 1em;
}
</style>
