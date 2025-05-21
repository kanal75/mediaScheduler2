<template>
  <img
    v-if="computedSource"
    :src="computedSource"
    class="thumbnail"
    @click="openDialog"
  />
  <!-- Dialog with full-size image -->
  <v-dialog v-model="dialog" max-width="50%">
    <v-card>
      <v-img :src="computedSource" contain class="pa-4" />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue";
import { ICellRendererParams } from "ag-grid-community";

interface MyRowData {
  metaData: {
    Url?: {
      Thumbnail?: string;
    };
    location?: string;
    path?: string;
  };
  scheduleTypes?: string;
}

export default defineComponent({
  name: "ImagesCellRenderer",
  props: {
    params: {
      type: Object as PropType<ICellRendererParams<MyRowData>>,
      required: true,
    },
  },
  setup(props) {
    const dialog = ref(false);

    const openDialog = () => {
      dialog.value = true;
    };

    const computedSource = computed(() => {
      const d = props.params.data;
      if (d?.scheduleTypes === "System" && d?.metaData?.path)
        return d.metaData.path;
      if (d?.metaData?.Url?.Thumbnail) return d.metaData.Url.Thumbnail;
      if (d?.metaData?.location) return d.metaData.location;
      return "";
    });

    return { dialog, openDialog, computedSource };
  },
});
</script>

<style>
.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1px 0px 1px 0px;
  border-radius: 5%;
}
</style>
