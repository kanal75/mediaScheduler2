<template>
  <img
    v-if="displayableSrc"
    :src="displayableSrc"
    class="thumbnail"
    style="cursor: pointer"
    :alt="altText"
    loading="lazy"
    decoding="async"
    fetchpriority="low"
    ref="thumbEl"
    @click="openDialog"
    @error="onImgError"
  />
  <!-- Dialog with full-size image (match NewScheduleCard) -->
  <Dialog
    v-model:visible="dialog"
    modal
    dismissableMask
    :style="{ width: '80vw' }"
  >
    <img
      :src="displayableSrc"
      alt="Image Preview"
      style="width: 100%; height: auto; max-height: 80vh; object-fit: contain"
      @error="onImgError"
    />
  </Dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
} from "vue";
import { ICellRendererParams } from "ag-grid-community";
import Dialog from "primevue/dialog";
import logo from "@/assets/logo.png";
import { useSystemStore } from "@/store/SystemStore";

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
  components: { Dialog },
  props: {
    params: {
      type: Object as PropType<ICellRendererParams<MyRowData>>,
      required: true,
    },
  },
  setup(props) {
    const dialog = ref(false);
    const systemStore = useSystemStore();

    const openDialog = () => {
      dialog.value = true;
    };

    const systemPngUrl = computed<string | null>(() => {
      if (props.params?.data?.scheduleTypes === "System" && systemStore.png) {
        return URL.createObjectURL(systemStore.png);
      }
      return null;
    });

    const computedSource = computed(() => {
      const d = props.params.data as MyRowData & {
        Data?: { Url?: { Thumbnail?: string } };
      };
      // Match NewScheduleCard behavior for System
      if (d?.scheduleTypes === "System" && systemPngUrl.value)
        return systemPngUrl.value;
      // Prefer Data.Url.Thumbnail if present (parity with NewScheduleCard)
      if (d?.Data?.Url?.Thumbnail) return d.Data.Url.Thumbnail;
      if (d?.metaData?.Url?.Thumbnail) return d.metaData.Url.Thumbnail;
      if (d?.metaData?.location) return d.metaData.location;
      if (d?.metaData?.path) return d.metaData.path;
      return "";
    });

    type MinimalData = { metaData?: { General?: { Name?: string } } } & {
      BSKEY?: string;
    };
    const altText = computed(() => {
      const d = (props.params?.data as MinimalData) || {};
      return d?.metaData?.General?.Name || d?.BSKEY || "Image";
    });

    // Resolve to an actually loadable URL like MediaGallery
    const isProd = process.env.NODE_ENV === "production";
    const baseHost = isProd ? window.location.origin : "http://127.0.0.1";
    const apiBase = `${baseHost}/ROOT/`;

    function buildCandidates(input: string): string[] {
      if (!input) return [];
      const variants = new Set<string>();
      const backslashFixed = input.replace(/\\/g, "/");
      const enc = encodeURI(backslashFixed);
      const lower = backslashFixed.toLowerCase();
      // as-is
      variants.add(backslashFixed);
      variants.add(enc);
      // absolute or blob/data URLs
      if (
        /^(https?:)?\/\//i.test(backslashFixed) ||
        /^(blob:|data:)/i.test(backslashFixed)
      ) {
        return Array.from(variants);
      }
      if (lower.includes("/root/")) {
        const idx = lower.indexOf("/root/");
        const after = backslashFixed.slice(idx + "/root/".length);
        variants.add(`${apiBase}${after}`);
        variants.add(encodeURI(`${apiBase}${after}`));
      }
      if (backslashFixed.startsWith("/")) {
        variants.add(`${baseHost}${backslashFixed}`);
        variants.add(encodeURI(`${baseHost}${backslashFixed}`));
      }
      if (backslashFixed.startsWith("ROOT/")) {
        variants.add(`${baseHost}/${backslashFixed}`);
        variants.add(encodeURI(`${baseHost}/${backslashFixed}`));
        const after = backslashFixed.substring("ROOT/".length);
        variants.add(`${apiBase}${after}`);
        variants.add(encodeURI(`${apiBase}${after}`));
      }
      variants.add(`${apiBase}${backslashFixed}`);
      variants.add(encodeURI(`${apiBase}${backslashFixed}`));
      return Array.from(variants);
    }

    function probeImage(url: string, timeoutMs = 4000): Promise<boolean> {
      return new Promise((resolve) => {
        const img = new Image();
        let done = false;
        const timer = setTimeout(() => {
          if (!done) {
            done = true;
            img.src = "";
            resolve(false);
          }
        }, timeoutMs);
        img.onload = () => {
          if (!done) {
            done = true;
            clearTimeout(timer);
            resolve(true);
          }
        };
        img.onerror = () => {
          if (!done) {
            done = true;
            clearTimeout(timer);
            resolve(false);
          }
        };
        img.src = url;
      });
    }

    const resolvedSrc = ref("");
    const thumbEl = ref<HTMLImageElement | null>(null);
    const isVisible = ref(false);
    const cache = new Map<string, string>();

    async function resolveSrc(raw: string) {
      if (!raw) {
        resolvedSrc.value = logo;
        return;
      }
      if (cache.has(raw)) {
        resolvedSrc.value = cache.get(raw) as string;
        return;
      }
      const candidates = buildCandidates(raw);
      for (const c of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await probeImage(c);
        if (ok) {
          cache.set(raw, c);
          resolvedSrc.value = c;
          return;
        }
      }
      resolvedSrc.value = logo;
    }

    watch(
      computedSource,
      (src) => {
        if (isVisible.value) {
          resolveSrc(src);
        } else {
          // defer until visible
          resolvedSrc.value = "";
        }
      },
      { immediate: true }
    );

    onMounted(() => {
      // Use IntersectionObserver to defer resolution until the image is near viewport
      if (thumbEl.value && typeof IntersectionObserver !== "undefined") {
        const obs = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                isVisible.value = true;
                resolveSrc(computedSource.value);
                obs.disconnect();
                break;
              }
            }
          },
          { root: null, rootMargin: "200px", threshold: 0.01 }
        );
        obs.observe(thumbEl.value);
        // Fallback: if already resolved or observer not supported
      } else if (!resolvedSrc.value) {
        resolveSrc(computedSource.value);
      }
    });
    onUnmounted(() => {
      // nothing to clean due to disconnect on intersect
    });

    const displayableSrc = computed(() => {
      // Show placeholder until visible/resolved
      return (
        resolvedSrc.value ||
        (isVisible.value ? computedSource.value : "") ||
        logo
      );
    });

    const onImgError = (e: Event) => {
      const target = e.target as HTMLImageElement | null;
      if (target) target.src = logo;
    };

    return {
      dialog,
      openDialog,
      computedSource,
      resolvedSrc,
      thumbEl,
      displayableSrc,
      altText,
      logo,
      onImgError,
    };
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
