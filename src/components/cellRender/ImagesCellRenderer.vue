<template>
  <img
    v-if="params.data?.metaData?.Url?.Thumbnail"
    :src="params.data.metaData.Url.Thumbnail"
    class="thumbnail"
    @click="openDialog"
  />
  <!-- Dialog with full-size image -->
  <v-dialog v-model="dialog" max-width="50%">
    <v-card>
      <!-- Large image in dialog (choose 'contain' to see the entire image, or 'cover' to fill) -->
      <v-img :src="params.data?.metaData.Url.Thumbnail" contain class="pa-4" />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { ICellRendererParams } from "ag-grid-community";

interface MyRowData {
  metaData: {
    Url: {
      Thumbnail: string;
    };
  };
}

export default defineComponent({
  name: "ImagesCellRenderer",
  props: {
    params: {
      type: Object as PropType<ICellRendererParams<MyRowData>>,
      required: true,
    },
  },
  setup() {
    const dialog = ref(false);

    const openDialog = () => {
      dialog.value = true;
    };

    return { dialog, openDialog };
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
