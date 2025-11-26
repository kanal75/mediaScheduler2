<template>
  <div class="media-gallery">
    <Card class="p-4 shadow-2">
      <template #title>Media Gallery</template>
      <template #content>
        <div
          v-if="rootStore.treeData === null"
          class="flex justify-content-center align-items-center"
          style="min-height: 200px"
        >
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        </div>
        <div v-else>
          <div v-if="finalImages.length > 0">
            <div
              class="mt-4"
              style="
                max-height: calc(100vh - 220px);
                overflow-y: auto;
                overflow-x: hidden;
                padding-bottom: 2rem;
              "
            >
              <div class="grid" style="row-gap: 24px">
                <div
                  v-for="(image, index) in finalImages"
                  :key="index"
                  class="col-12 md:col-4 px-2"
                >
                  <div class="flex flex-column align-items-center mb-3">
                    <img
                      v-if="image.thumbnailImageSrc"
                      :src="image.thumbnailImageSrc"
                      class="thumbnail"
                      loading="lazy"
                      decoding="async"
                      fetchpriority="low"
                      @click="selectFile(index)"
                      :alt="image.alt"
                      @error="onImgError"
                    />
                    <div style="font-size: 12px; color: #888; margin-top: 4px">
                      {{ image.created }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-2">No images found.</div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineComponent, computed, ref, watch, onMounted } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useRefStore } from "@/store/RefStore";
import {
  useMediaStore,
  type MediaFile,
  type MediaFolder,
} from "@/store/MediaStore";
import Card from "primevue/card";
import ProgressSpinner from "primevue/progressspinner";
import fallbackLogo from "@/assets/logo.png";

export default defineComponent({
  name: "MediaGallery",
  components: { Card, ProgressSpinner },
  setup() {
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const mediaStore = useMediaStore();
    const selectedFolder = computed<MediaFolder | null>(
      () => mediaStore.focusedFolder
    );

    const isProd = process.env.NODE_ENV === "production";
    const baseHost = isProd ? window.location.origin : "http://127.0.0.1";
    const apiBase = `${baseHost}/ROOT/`;

    watch(
      () => rootStore.treeData,
      (val) => {
        if (val && typeof val === "object") {
          if (!mediaStore.focusedFolder) {
            const firstWithFiles = findFirstFolderWithFiles(val);
            if (firstWithFiles) {
              mediaStore.focusFolder(firstWithFiles as MediaFolder);
            }
          }
        }
      },
      { immediate: true }
    );

    function findFirstFolderWithFiles(node: unknown): unknown | null {
      if (!node) return null;
      const list = Array.isArray(node) ? node : [node];
      for (const n of list) {
        const nObj = n as Record<string, any>;
        const folders = nObj?.Folder
          ? Array.isArray(nObj.Folder)
            ? nObj.Folder
            : [nObj.Folder]
          : [];
        for (const f of folders) {
          const fObj = f as Record<string, any>;
          const files = fObj?.File
            ? Array.isArray(fObj.File)
              ? fObj.File
              : [fObj.File]
            : [];
          if (files.length > 0) return f;
        }
        for (const f of folders) {
          const found = findFirstFolderWithFiles(f);
          if (found) return found;
        }
      }
      return null;
    }

    function collectAllFiles(node: unknown): any[] {
      if (!node) return [];
      const queue: any[] = Array.isArray(node) ? [...node] : [node];
      const files: any[] = [];
      while (queue.length) {
        const curr = queue.shift();
        if (!curr || typeof curr !== "object") continue;
        const obj = curr as Record<string, any>;
        if (obj.File) {
          if (Array.isArray(obj.File)) files.push(...obj.File);
          else files.push(obj.File);
        }
        if (obj.files && Array.isArray(obj.files)) {
          files.push(...obj.files);
        }
        if (obj.Folder) {
          if (Array.isArray(obj.Folder)) queue.push(...obj.Folder);
          else queue.push(obj.Folder);
        }
        Object.keys(obj).forEach((k) => {
          const v = obj[k];
          if (k === "File" || k === "Folder" || k === "files") return;
          if (Array.isArray(v)) queue.push(...v);
          else if (v && typeof v === "object") queue.push(v);
        });
      }
      return files;
    }

    function hasFiles(folder: any): boolean {
      if (!folder || typeof folder !== "object") return false;
      if (Array.isArray(folder.files) && folder.files.length > 0) return true;
      if (Array.isArray(folder.File) && folder.File.length > 0) return true;
      if (folder.File) return true;
      return false;
    }

    const currentFolder = computed(() => {
      const sel = selectedFolder.value;
      if (hasFiles(sel)) return sel;
      return findFirstFolderWithFiles(rootStore.treeData) as any;
    });

    const activeIndex = ref(0);
    const displayCustom = ref(false);

    onMounted(async () => {
      if (!rootStore.treeData) {
        try {
          await rootStore.fetchTreeData();
        } catch (e) {
          /* failed to fetch tree data in MediaGallery */
        }
      }
    });

    type FileItem = MediaFile;
    const rawFileImages = computed(() => {
      // Only honor a single-file view when the tree explicitly triggered it
      const previewSelection = mediaStore.previewFile;
      const persistedSelection = mediaStore.selectedFile;
      const folder = currentFolder.value as MediaFolder | null;
      let files: MediaFile[] = [];

      if (mediaStore.singleFilePreviewActive && previewSelection) {
        files = [previewSelection];
      } else {
        if (folder) {
          if (Array.isArray(folder.files)) {
            files = folder.files as MediaFile[];
          } else if (Array.isArray(folder.File)) {
            files = folder.File as MediaFile[];
          } else if (folder.File) {
            files = [folder.File as MediaFile];
          }
        }
        if (!files || files.length === 0) {
          const fallbackFiles = collectAllFiles(rootStore.treeData).slice(
            0,
            120
          ) as MediaFile[];
          files = fallbackFiles.filter((f): f is MediaFile => !!f);
        }
        if (
          (!files || files.length === 0) &&
          (previewSelection || persistedSelection)
        ) {
          const fallbackSelection = previewSelection || persistedSelection;
          if (fallbackSelection) {
            files = [fallbackSelection];
          }
        }
      }
      if (files.length > 0) {
        const sortedFiles = [...files].sort((a, b) => {
          const aCreated = new Date(
            a.Data?.FileInfo?.Created || a.Data?.Info?.Created || 0
          ).getTime();
          const bCreated = new Date(
            b.Data?.FileInfo?.Created || b.Data?.Info?.Created || 0
          ).getTime();
          return bCreated - aCreated;
        });
        const images = sortedFiles.map((file) => {
          const rawThumb = String(
            file.Data?.Url?.Thumbnail &&
              String(file.Data.Url.Thumbnail).trim() !== ""
              ? String(file.Data.Url.Thumbnail)
              : ""
          );
          let createdRaw =
            file.Data?.FileInfo?.Created || file.Data?.Info?.Created;
          let created = "-";
          if (createdRaw) {
            const dateObj = new Date(createdRaw);
            if (!isNaN(dateObj.getTime())) {
              const yyyy = dateObj.getFullYear();
              const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
              const dd = String(dateObj.getDate()).padStart(2, "0");
              const hh = String(dateObj.getHours()).padStart(2, "0");
              const min = String(dateObj.getMinutes()).padStart(2, "0");
              created = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
            }
          }
          return {
            thumbnailImageSrc: rawThumb,
            alt: file.Data?.General?.Name || file.BSKEY || "File Image",
            rawFile: file,
            created,
          };
        });
        return images;
      }
      return [];
    });

    const finalImages = ref<any[]>([]);

    function buildCandidates(input: string): string[] {
      if (!input) return [];
      const variants = new Set<string>();
      const raw = input;
      const backslashFixed = raw.replace(/\\/g, "/");
      const enc = encodeURI(backslashFixed);
      const lower = backslashFixed.toLowerCase();
      variants.add(backslashFixed);
      variants.add(enc);
      if (/^https?:\/\//i.test(backslashFixed)) {
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
        variants.add(`${apiBase}${backslashFixed.substring("ROOT/".length)}`);
        variants.add(
          encodeURI(`${apiBase}${backslashFixed.substring("ROOT/".length)}`)
        );
      }
      variants.add(`${apiBase}${backslashFixed}`);
      variants.add(encodeURI(`${apiBase}${backslashFixed}`));
      return Array.from(variants);
    }

    function probeImage(url: string, timeoutMs = 6000): Promise<boolean> {
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

    async function resolveOneThumbnail(input: string): Promise<string> {
      const candidates = buildCandidates(input);
      for (const c of candidates) {
        const ok = await probeImage(c, 3000);
        if (ok) return c;
      }
      return fallbackLogo;
    }

    const resolvedCache = new Map<string, string>();

    watch(
      rawFileImages,
      async (list) => {
        finalImages.value = list.map((it) => ({ ...it }));
        const concurrency = 4;
        let idx = 0;
        async function worker() {
          while (idx < finalImages.value.length) {
            const myIndex = idx++;
            const item = finalImages.value[myIndex];
            const raw = item.thumbnailImageSrc;
            if (!raw) {
              item.thumbnailImageSrc = fallbackLogo;
              continue;
            }
            if (resolvedCache.has(raw)) {
              item.thumbnailImageSrc = resolvedCache.get(raw) as string;
              continue;
            }
            const resolved = await resolveOneThumbnail(raw);
            if (resolved && resolved !== fallbackLogo) {
              resolvedCache.set(raw, resolved);
              if (finalImages.value[myIndex]) {
                finalImages.value[myIndex].thumbnailImageSrc = resolved;
              }
            }
          }
        }
        await Promise.all(Array.from({ length: concurrency }, () => worker()));
      },
      { immediate: true }
    );

    const selectFile = (index: number) => {
      const file = finalImages.value[index].rawFile as MediaFile;
      mediaStore.commitSelection(file);
      rootStore.newSchedule.metaData =
        (file.Data as typeof rootStore.newSchedule.metaData | undefined) ||
        rootStore.newSchedule.metaData;
      refStore.showMediaDialog = false;
    };

    const onImgError = (event: Event) => {
      const el = event.target as HTMLImageElement;
      if (el && el.src !== fallbackLogo) {
        el.onerror = null;
        el.src = fallbackLogo;
      }
    };

    return {
      rootStore,
      finalImages,
      selectFile,
      onImgError,
    };
  },
});
</script>

<style scoped>
.media-gallery {
  /* Inherit current theme background */
  background: transparent;
}
.thumbnail {
  width: 100%;
  height: auto;
  cursor: pointer;
  object-fit: contain;
  display: block;
  border-radius: 8px;
  /* Match the current theme (PrimeVue exposes these CSS variables) */
  background: transparent;
}
</style>
