<template>
  <div class="h-full w-full">
    <Card class="h-full w-full" style="overflow: auto; margin-left: 10px">
      <!-- Header: Use the selected file's thumbnail as the header image -->
      <template #header>
        <div class="header-image-wrapper" style="width: 100%; overflow: hidden">
          <img
            :src="selectedFileThumbnail"
            alt="File Thumbnail"
            style="
              width: 100%;
              height: auto;
              cursor: pointer;
              object-fit: contain;
            "
            @click="openDialog"
            @error="(e:any)=> (e.target.src = logo)"
          />
          <Dialog
            v-model:visible="dialog"
            modal
            dismissableMask
            :style="{ width: '80vw' }"
          >
            <img
              :src="selectedFileThumbnail"
              alt="File Thumbnail Preview"
              style="width: 100%; height: auto; object-fit: contain"
              @error="(e:any)=> (e.target.src = logo)"
            />
          </Dialog>
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
          severity="danger"
          class="mt-4"
          @click="rootStore.selectedFile = null"
        >
          <template #icon>
            <Icon name="trash" />
          </template>
        </Button>
      </template>
    </Card>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useRootStore } from "@/store/RootStore";
import { useSystemStore } from "@/store/SystemStore";
import Card from "primevue/card";
import Dialog from "primevue/dialog";
import Icon from "@/components/icons/Icon.vue";
import logo from "@/assets/logo.png";

export default defineComponent({
  name: "NewScheduleCard",
  components: { Card, Dialog, Icon },
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
        : logo;
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
      logo,
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
