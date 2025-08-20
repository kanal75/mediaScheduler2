<template>
  <div v-if="!(params.node && params.node.group)">
    <Tag
      class="duration-tag"
      :value="displayValue"
      :severity="isReadOnly ? 'primary' : 'info'"
    >
      <template #default>
        {{ displayValue }}
        <span v-if="!isReadOnly" class="edit-icon">
          <Icon name="pencil" />
        </span>
        <span v-else class="readonly-label">{{ scheduleTypes }}</span>
      </template>
    </Tag>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import Tag from "primevue/tag";
import Icon from "@/components/icons/Icon.vue";

export default defineComponent({
  name: "DurationCellRender",
  components: { Tag, Icon },
  props: {
    params: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    // AG Grid passes the row data in params.data
    const metaData = props.params.data?.metaData || {};
    const scheduleTypes = props.params.data?.scheduleTypes || "";
    // Try to get the editable duration first
    const editableDuration = metaData.duration;
    // Try to get the read-only duration from MediaInfo
    let mediaInfoDuration = undefined;
    if (
      metaData.MediaInfo &&
      Array.isArray(metaData.MediaInfo.Durations) &&
      metaData.MediaInfo.Durations[0]?.TimeCode
    ) {
      mediaInfoDuration = metaData.MediaInfo.Durations[0].TimeCode;
    }
    // Compute which value to show
    const displayValue = computed(() => {
      // Hide value for group rows
      if (props.params.node && props.params.node.group) return "";
      if (editableDuration) return editableDuration;
      if (mediaInfoDuration) return mediaInfoDuration;
      return "--:--:--:--";
    });
    // If the value comes from MediaInfo, it's read-only
    const isReadOnly = computed(() => {
      return !editableDuration && !!mediaInfoDuration;
    });
    // AG Grid expects a refresh method for Vue cellRenderers
    return { displayValue, isReadOnly, scheduleTypes, refresh: () => false };
  },
});
</script>

<style scoped>
.duration-tag {
  margin: 0;
  padding: 0 4px;
  display: inline-block;
  line-height: 1;
  font-size: inherit;
}
.readonly-label {
  font-size: 0.8em;
  color: #888;
  margin-left: 0.5em;
}
.edit-icon {
  margin-left: 0.5em;
  vertical-align: middle;
}
</style>
