<!-- eslint-disable prettier/prettier -->
<template>
  <img
    v-if="displayableSrc"
    :src="displayableSrc"
    :alt="alt"
    class="thumbnail"
    loading="lazy"
    decoding="async"
    fetchpriority="low"
    ref="imgEl"
    v-bind="$attrs"
    @click="$emit('click', $event)"
    @error="onImgError"
  />
  <img
    v-else
    :src="logo"
    :alt="alt"
    class="thumbnail"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import logo from "@/assets/logo.png";

export default defineComponent({
  name: "LazyResolvedImg",
  inheritAttrs: true,
  emits: ["click"],
  props: {
    srcRaw: { type: String, required: true },
    alt: { type: String, default: "Image" },
  },
  setup(props) {
    const isProd = process.env.NODE_ENV === "production";
    const baseHost = isProd ? window.location.origin : "http://127.0.0.1";
    const apiBase = `${baseHost}/ROOT/`;

    function buildCandidates(input: string): string[] {
      if (!input) return [];
      const variants = new Set<string>();
      const backslashFixed = input.replace(/\\/g, "/");
      const enc = encodeURI(backslashFixed);
      const lower = backslashFixed.toLowerCase();
      variants.add(backslashFixed);
      variants.add(enc);
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

    const imgEl = ref<HTMLImageElement | null>(null);
    const isVisible = ref(false);
    const resolvedSrc = ref("");
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

    onMounted(() => {
      if (imgEl.value && typeof IntersectionObserver !== "undefined") {
        const obs = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                isVisible.value = true;
                resolveSrc(props.srcRaw);
                obs.disconnect();
                break;
              }
            }
          },
          { root: null, rootMargin: "200px", threshold: 0.01 }
        );
        obs.observe(imgEl.value);
      } else {
        resolveSrc(props.srcRaw);
      }
    });

    const displayableSrc = computed(() => {
      return (resolvedSrc.value ||
        (isVisible.value ? props.srcRaw : "") ||
        logo) as string;
    });

    const onImgError = (e: Event) => {
      const target = e.target as HTMLImageElement | null;
      if (target) target.src = logo;
    };

    return { imgEl, displayableSrc, onImgError, logo };
  },
});
</script>

<style scoped>
.thumbnail {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}
</style>

<template>
  <img
    v-if="displayableSrc"
    :src="displayableSrc"
    :alt="alt"
    class="thumbnail"
    loading="lazy"
    decoding="async"
    fetchpriority="low"
    ref="imgEl"
    v-bind="$attrs"
    @error="onImgError"
  />
  <img v-else :src="logo" :alt="alt" class="thumbnail" v-bind="$attrs" />
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import logo from "@/assets/logo.png";

export default defineComponent({
  name: "LazyResolvedImg",
  inheritAttrs: true,
  props: {
    srcRaw: { type: String, required: true },
    alt: { type: String, default: "Image" },
  },
  setup(props) {
    const isProd = process.env.NODE_ENV === "production";
    const baseHost = isProd ? window.location.origin : "http://127.0.0.1";
    const apiBase = `${baseHost}/ROOT/`;

    function buildCandidates(input: string): string[] {
      if (!input) return [];
      const variants = new Set<string>();
      const backslashFixed = input.replace(/\\/g, "/");
      const enc = encodeURI(backslashFixed);
      const lower = backslashFixed.toLowerCase();
      variants.add(backslashFixed);
      variants.add(enc);
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

    const imgEl = ref<HTMLImageElement | null>(null);
    const isVisible = ref(false);
    const resolvedSrc = ref("");
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

    onMounted(() => {
      if (imgEl.value && typeof IntersectionObserver !== "undefined") {
        const obs = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                isVisible.value = true;
                resolveSrc(props.srcRaw);
                obs.disconnect();
                break;
              }
            }
          },
          { root: null, rootMargin: "200px", threshold: 0.01 }
        );
        obs.observe(imgEl.value);
      } else {
        resolveSrc(props.srcRaw);
      }
    });

    const displayableSrc = computed(() => {
      return (resolvedSrc.value ||
        (isVisible.value ? props.srcRaw : "") ||
        logo) as string;
    });

    const onImgError = (e: Event) => {
      const target = e.target as HTMLImageElement | null;
      if (target) target.src = logo;
    };

    return { imgEl, displayableSrc, onImgError, logo };
  },
});
</script>

<style scoped>
.thumbnail {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}
</style>
