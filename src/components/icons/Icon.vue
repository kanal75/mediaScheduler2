<!-- eslint-disable prettier/prettier -->
<template>
  <svg
    :width="sizePx"
    :height="sizePx"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    :class="cls"
  >
    <!-- plus -->
    <g
      v-if="name === 'plus'"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <path d="M10 4v12" />
      <path d="M4 10h12" />
    </g>

    <!-- cog -->
    <g
      v-else-if="name === 'cog'"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linejoin="round"
    >
      <circle cx="10" cy="10" r="3.5" fill="none" />
      <path d="M10 2v3" />
      <path d="M10 15v3" />
      <path d="M2 10h3" />
      <path d="M15 10h3" />
      <path d="M4 4l2.2 2.2" />
      <path d="M13.8 13.8L16 16" />
      <path d="M4 16l2.2-2.2" />
      <path d="M13.8 6.2L16 4" />
    </g>

    <!-- grid -->
    <g v-else-if="name === 'grid'" :stroke-width="s" stroke="currentColor">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </g>

    <!-- moon -->
    <path
      v-else-if="name === 'moon'"
      d="M12.5 2.5a7.5 7.5 0 1 0 5 13.5 8 8 0 1 1 -5-13.5z"
      fill="currentColor"
    />

    <!-- sun -->
    <g
      v-else-if="name === 'sun'"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <circle cx="10" cy="10" r="3.5" fill="none" />
      <path d="M10 1.5v2.5" />
      <path d="M10 16v2.5" />
      <path d="M1.5 10h2.5" />
      <path d="M16 10h2.5" />
      <path d="M4 4l1.8 1.8" />
      <path d="M14.2 14.2L16 16" />
      <path d="M4 16l1.8-1.8" />
      <path d="M14.2 5.8L16 4" />
    </g>

    <!-- user -->
    <g v-else-if="name === 'user'" :stroke-width="s" stroke="currentColor">
      <circle cx="10" cy="7" r="3.5" fill="none" />
      <path
        d="M3 17c1.8-3 4.8-4.5 7-4.5S15.2 14 17 17"
        stroke-linecap="round"
        fill="none"
      />
    </g>

    <!-- refresh -->
    <g
      v-else-if="name === 'refresh'"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <path d="M16.5 6a7 7 0 1 0 1.5 4h-3" fill="none" />
      <path d="M17.5 2.5v3.5H14" />
    </g>

    <!-- sync -->
    <g
      v-else-if="name === 'sync'"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <path d="M4 10a6 6 0 0 1 10.4-3.8" fill="none" />
      <path d="M14.5 3.5v3.5H11" />
      <path d="M16 10a6 6 0 0 1-10.4 3.8" fill="none" />
      <path d="M5.5 16.5V13H9" />
    </g>

    <!-- check -->
    <path
      v-else-if="name === 'check'"
      d="M4 10.5l4 4 8-9"
      :stroke-width="s"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- times (close) -->
    <g
      v-else-if="name === 'times'"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <path d="M5 5l10 10" />
      <path d="M15 5L5 15" />
    </g>

    <!-- save -->
    <g v-else-if="name === 'save'" :stroke-width="s" stroke="currentColor">
      <path d="M4 4h12v12H4z" fill="none" />
      <path d="M7 4v6h6V4" />
      <path d="M7 16v-3h6v3" />
    </g>

    <!-- trash -->
    <g
      v-else-if="name === 'trash'"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <path d="M4 6h12" />
      <path d="M8 6V4h4v2" />
      <rect x="5.5" y="6" width="9" height="11" rx="1" fill="none" />
    </g>

    <!-- copy -->
    <g v-else-if="name === 'copy'" :stroke-width="s" stroke="currentColor">
      <rect x="7" y="7" width="10" height="10" rx="1" fill="none" />
      <rect x="3" y="3" width="10" height="10" rx="1" fill="none" />
    </g>

    <!-- play -->
    <path v-else-if="name === 'play'" d="M7 5l9 5-9 5V5z" fill="currentColor" />

    <!-- pause -->
    <g v-else-if="name === 'pause'" fill="currentColor">
      <rect x="6" y="5" width="3" height="10" rx="0.5" />
      <rect x="11" y="5" width="3" height="10" rx="0.5" />
    </g>

    <!-- star -->
    <path
      v-else-if="name === 'star'"
      d="M10 2.5l2.1 4.2 4.6.7-3.3 3.2.8 4.6L10 13.8 5.8 15.2l.8-4.6L3.3 7.4l4.6-.7L10 2.5z"
      fill="currentColor"
    />

    <!-- pencil/edit -->
    <g
      v-else-if="name === 'pencil'"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <path d="M4 13.5l8.5-8.5 2.5 2.5L6.5 16H4v-2.5z" fill="none" />
    </g>

    <!-- arrow-right -->
    <path
      v-else-if="name === 'arrow-right'"
      d="M7 5l6 5-6 5V5z"
      fill="currentColor"
    />

    <!-- minus -->
    <path
      v-else-if="name === 'minus'"
      d="M4 10h12"
      :stroke-width="s"
      stroke="currentColor"
      stroke-linecap="round"
    />

    <!-- default dot -->
    <circle v-else cx="10" cy="10" r="2" fill="currentColor" />
  </svg>
</template>

<!-- eslint-disable-next-line -->
<script lang="ts">
/* eslint-disable */
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "Icon",
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 16 },
    class: { type: String, default: "" },
    stroke: { type: [Number, String], default: 1.8 },
  },
  setup(props) {
    const sizePx = computed(() =>
      typeof props.size === "number" ? `${props.size}` : props.size
    );
    const s = computed(() => Number(props.stroke) || 1.8);
    const cls = computed(() => props.class);
    return { sizePx, s, cls };
  },
});
</script>

<style scoped>
svg {
  display: inline-block;
  vertical-align: middle;
}
</style>
