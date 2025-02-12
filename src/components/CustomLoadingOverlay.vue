<template>
  <div class="ag-overlay-loading-center" role="presentation">
    <div
      role="presentation"
      style="
        height: 100px;
        width: 100px;
        background: url(https://www.ag-grid.com/images/ag-grid-loading-spinner.svg)
          center / contain no-repeat;
        margin: 0 auto;
      "
    ></div>
    <div aria-live="polite" aria-atomic="true">
      {{ params?.loadingMessage }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "CustomLoadingOverlay",
  props: {
    params: {
      type: Object as PropType<{ loadingMessage?: string }>,
      required: false,
      default: () => ({ loadingMessage: "Loading..." }),
    },
  },
});
</script>

<style scoped>
.ag-overlay-loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  text-align: center;
}
</style>
