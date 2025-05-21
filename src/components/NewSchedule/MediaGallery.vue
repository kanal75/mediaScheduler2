<template>
  <v-card class="pa-4 elevation-2">
    <div v-if="selectedFolder && fileImages.length > 0">
      <!-- Full-screen gallery view (Galleria component) -->
      <Galleria
        v-if="displayCustom"
        v-model:activeIndex="activeIndex"
        v-model:visible="displayCustom"
        :value="fileImages"
        :responsiveOptions="responsiveOptions"
        :numVisible="7"
        containerStyle="max-width: 850px"
        :circular="true"
        :fullScreen="true"
        :showItemNavigators="true"
        :showThumbnails="false"
      >
        <template #item="slotProps">
          <!-- Natural sizing for images -->
          <div class="cursor-pointer" @click="imageClick(activeIndex)">
            <v-img
              :src="slotProps.item.thumbnailImageSrc"
              :alt="slotProps.item.alt"
              width="100%"
              aspect-ratio="16/9"
              style="object-fit: cover; border-radius: 8px"
              height="216"
              @error="
                slotProps.item.thumbnailImageSrc = require('@/assets/logo.png')
              "
            />
          </div>
        </template>
        <template #thumbnail="slotProps">
          <div>
            <v-img
              :src="slotProps.item.thumbnailImageSrc"
              :alt="slotProps.item.alt"
              width="100%"
              aspect-ratio="16/9"
              style="object-fit: cover; border-radius: 8px"
              height="216"
              @error="
                slotProps.item.thumbnailImageSrc = require('@/assets/logo.png')
              "
            />
          </div>
        </template>
      </Galleria>

      <!-- Thumbnails grid -->
      <div
        class="mt-4"
        style="
          max-height: calc(100vh - 220px);
          overflow-y: auto;
          padding-bottom: 2rem;
        "
      >
        <v-container fluid>
          <v-row dense style="row-gap: 24px">
            <v-col
              v-for="(image, index) in fileImages"
              :key="index"
              cols="12"
              md="4"
            >
              <div class="d-flex flex-column align-center">
                <!-- Use native <img> for thumbnail, like ImagesCellRenderer.vue -->
                <img
                  v-if="image.thumbnailImageSrc"
                  :src="image.thumbnailImageSrc"
                  class="thumbnail"
                  @click="openDialog(index)"
                  :alt="image.alt"
                  @error="onImgError"
                />
                <div style="font-size: 12px; color: #888; margin-top: 4px">
                  {{ image.created }}
                </div>
                <v-btn
                  color="primary"
                  block
                  class="ma-0 mt-2"
                  @click="selectFile(index)"
                >
                  Select
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <!-- Dialog for full-size image preview -->
      <v-dialog v-model="dialog" max-width="50%">
        <v-card>
          <v-img
            v-if="dialogIndex !== null && fileImages[dialogIndex]"
            :src="fileImages[dialogIndex].thumbnailImageSrc"
            contain
            class="pa-4"
            height="216"
            width="100%"
            @error="
              fileImages[
                dialogIndex
              ].thumbnailImageSrc = require('@/assets/logo.png')
            "
          />
        </v-card>
      </v-dialog>
    </div>
    <div v-else class="pa-2">No folder selected.</div>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from "vue";
import { useRootStore } from "@/store/RootStore";

export default defineComponent({
  name: "MediaGallery",
  setup() {
    const rootStore = useRootStore();
    const selectedFolder = computed(() => rootStore.selectedFolder);

    // Gallery controls
    const activeIndex = ref(0);
    const displayCustom = ref(false);
    const responsiveOptions = ref([
      { breakpoint: "1024px", numVisible: 7 },
      { breakpoint: "768px", numVisible: 3 },
      { breakpoint: "560px", numVisible: 1 },
    ]);

    // Build fileImages and use a fallback if thumbnail is missing.
    const fileImages = computed(() => {
      const folder = selectedFolder.value;
      let files: any[] = [];
      if (folder) {
        if (Array.isArray(folder.files)) {
          files = folder.files;
        } else if (Array.isArray(folder.File)) {
          files = folder.File;
        } else if (folder.File) {
          files = [folder.File];
        }
      }
      if (files.length > 0) {
        // Sort files by FileInfo.Created or Info.Created descending (newest first)
        const sortedFiles = [...files].sort((a, b) => {
          const aCreated = new Date(
            a.Data?.FileInfo?.Created || a.Data?.Info?.Created || 0
          ).getTime();
          const bCreated = new Date(
            b.Data?.FileInfo?.Created || b.Data?.Info?.Created || 0
          ).getTime();
          return bCreated - aCreated;
        });
        const images = sortedFiles.map((file, index) => {
          const thumbnail =
            file.Data?.Url?.Thumbnail && file.Data.Url.Thumbnail.trim() !== ""
              ? file.Data.Url.Thumbnail
              : "https://via.placeholder.com/150";
          // Try FileInfo.Created, then Info.Created
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
            thumbnailImageSrc: thumbnail,
            alt: file.Data?.General?.Name || file.BSKEY || "File Image",
            rawFile: file,
            created,
          };
        });
        return images;
      }
      return [];
    });

    // Defensive watcher: close gallery if images become empty or folder changes
    watch(
      [fileImages, selectedFolder],
      ([images, folder], [prevImages, prevFolder]) => {
        if (displayCustom.value && images.length === 0) {
          displayCustom.value = false;
          activeIndex.value = 0;
        }
        if (displayCustom.value && folder !== prevFolder) {
          displayCustom.value = false;
          activeIndex.value = 0;
        }
      }
    );

    // Open the full-screen gallery view
    const imageClick = (index: number) => {
      activeIndex.value = index;
      displayCustom.value = true;
    };

    // Select file
    const selectFile = (index: number) => {
      const file = fileImages.value[index].rawFile;
      rootStore.setSelectedFile(file);
    };

    // Open dialog for full-size image preview
    const dialog = ref(false);
    const dialogIndex = ref<number | null>(null);

    const openDialog = (index: number) => {
      dialogIndex.value = index;
      dialog.value = true;
    };

    const onImgError = (event: Event) => {
      (event.target as HTMLImageElement).src = require("@/assets/logo.png");
    };

    return {
      selectedFolder,
      fileImages,
      activeIndex,
      displayCustom,
      responsiveOptions,
      imageClick,
      selectFile,
      dialog,
      dialogIndex,
      openDialog,
      onImgError,
    };
  },
});
</script>
