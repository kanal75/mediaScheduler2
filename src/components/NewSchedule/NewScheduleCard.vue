<template>
  <div class="h-full w-full">
    <Card class="h-full w-full" style="overflow: auto; margin-left: 10px">
      <!-- Header: Use the selected file's thumbnail as the header image -->
      <template #header>
        <div class="header-image-wrapper" style="width: 100%; overflow: hidden">
          <v-img
            :src="selectedFileThumbnail"
            alt="File Thumbnail"
            @click="openDialog"
          />
          <v-dialog v-model="dialog" max-width="80%" attach="body">
            <v-card>
              <v-img
                :src="selectedFileThumbnail"
                alt="File Thumbnail Preview"
                contain
                class="pa-4"
                height="600"
                width="100%"
              />
            </v-card>
          </v-dialog>
        </div>
      </template>

      <!-- Title: Show the file's title -->
      <template #title>
        {{ selectedFileTitle }}
      </template>

      <!-- Subtitle: Show additional file info (e.g. file extension) -->
      <template #subtitle>
        {{ selectedFileSubtitle }}
        <div v-if="selectedFileDuration">
          {{ selectedFileDuration }}
        </div>
      </template>

      <!-- Remove Button -->
      <template #content>
        <Button
          v-if="selectedFile"
          label="Remove"
          icon="pi pi-trash"
          severity="danger"
          class="mt-4"
          @click="rootStore.selectedFile = null"
        />
      </template>
    </Card>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useSystemStore } from "@/store/SystemStore";

export default defineComponent({
  name: "NewScheduleCard",
  setup() {
    const rootStore = useRootStore();
    const selectedFile = computed(() => rootStore.selectedFile);
    const systemStore = useSystemStore();
    // Header thumbnail: Use the file’s thumbnail (or a default image)
    const systemPngUrl = computed(() => {
      if (rootStore.newSchedule.scheduleTypes === "System" && systemStore.png) {
        return URL.createObjectURL(systemStore.png);
      }
      return null;
    });

    const selectedFileThumbnail = computed(() => {
      if (rootStore.newSchedule.scheduleTypes === "System" && systemStore.png) {
        return systemPngUrl.value;
      }
      return selectedFile.value
        ? selectedFile.value.Data?.Url?.Thumbnail || ""
        : "https://primefaces.org/cdn/primevue/images/usercard.png";
    });

    // Title: The file's title or BSKEY as a fallback.
    const selectedFileTitle = computed(() => {
      if (rootStore.newSchedule.scheduleTypes === "System") {
        return ""; // Hide title if it's a system
      }
      return selectedFile.value
        ? selectedFile.value.Data?.General?.Name ||
            selectedFile.value.BSKEY ||
            "No Title"
        : "No File Selected";
    });

    // Subtitle: E.g., the file's extension.
    const selectedFileSubtitle = computed(() => {
      if (selectedFile.value && selectedFile.value.Data?.General?.Extension) {
        return `Extension: ${selectedFile.value.Data.General.Extension}`;
      }
      return "";
    });

    // Duration: Show for Clip or Music (from Data.scheduleTypes and Data.metaData)
    const selectedFileDuration = computed(() => {
      if (!selectedFile.value) return "";
      const type = rootStore.newSchedule.scheduleTypes;
      if (type === "Clip" || type === "Music") {
        const tc = selectedFile.value.Data?.MediaInfo?.Durations?.[0]?.TimeCode;
        if (tc && /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(tc)) {
          return `Duration: ${tc}`;
        }
      }
      return "";
    });

    const dialog = ref(false);
    const openDialog = () => {
      dialog.value = true;
    };

    return {
      rootStore,
      selectedFile,
      systemStore,
      systemPngUrl,
      selectedFileThumbnail,
      selectedFileTitle,
      selectedFileSubtitle,
      selectedFileDuration,
      dialog,
      openDialog,
    };
  },
});
</script>

<style scoped>
.header-image-wrapper img {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

.file-duration {
  color: #fff;
  background: #222;
  border-radius: 8px;
  padding: 0.15em 0.7em;
  font-size: 0.95em;
  font-family: monospace;
  font-weight: 600;
  letter-spacing: 0.03em;
  display: inline-block;
  margin-top: 0.25em;
  margin-left: 0.5em;
}
</style>
