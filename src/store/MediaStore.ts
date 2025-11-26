import { defineStore } from "pinia";

export type MediaFolder = Record<string, unknown>;

export interface MediaFile extends Record<string, unknown> {
  Data?: {
    Url?: { Thumbnail?: string };
    General?: { Name?: string; Extension?: string };
    MediaInfo?: { Durations?: Array<{ TimeCode?: string }> };
    FileInfo?: { Created?: string };
    Info?: { Created?: string };
  };
  BSKEY?: string;
}

export const useMediaStore = defineStore("MediaStore", {
  state: () => ({
    focusedFolder: null as MediaFolder | null,
    previewFile: null as MediaFile | null,
    selectedFile: null as MediaFile | null,
    singleFilePreviewActive: false,
  }),
  actions: {
    focusFolder(folder: MediaFolder | null) {
      this.focusedFolder = folder;
      if (!folder) {
        this.clearPreview();
      }
    },
    previewFileSelection(file: MediaFile | null) {
      this.previewFile = file;
      this.singleFilePreviewActive = !!file;
    },
    clearPreview() {
      this.previewFile = null;
      this.singleFilePreviewActive = false;
    },
    commitSelection(file: MediaFile | null) {
      this.selectedFile = file;
      this.clearPreview();
    },
    clearSelection() {
      this.selectedFile = null;
      this.clearPreview();
    },
    resetAll() {
      this.focusedFolder = null;
      this.selectedFile = null;
      this.clearPreview();
    },
  },
});
