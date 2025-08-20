<template>
  <div class="ag-overlay-loading-center" role="presentation">
    <img
      :src="spinner"
      alt="Loading..."
      style="height: 100px; width: 100px; display: block; margin: 0 auto"
    />
    <div aria-live="polite" aria-atomic="true">
      {{ params?.loadingMessage }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import spinner from "@/assets/ag-grid-loading-spinner.svg";

export default defineComponent({
  name: "CustomLoadingOverlay",
  props: {
    params: {
      type: Object as PropType<{ loadingMessage?: string }>,
      required: false,
      default: () => ({ loadingMessage: "Loading..." }),
    },
  },
  setup() {
    return { spinner };
  },
});
</script>

<style>
.ag-overlay-loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  text-align: center;
}
</style>
