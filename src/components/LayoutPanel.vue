<template>
  <Drawer
    v-model:visible="refStore.showLayoutPanel"
    position="right"
    class="layout-drawer"
    :dismissable="true"
    :style="{ width: '620px', maxWidth: '100vw' }"
  >
    <div class="panel-root">
      <!-- Header -->
      <div class="panel-header">
        <div class="top-row">
          <h3 class="title">
            Layouts<span class="count">{{ layouts.length }}</span>
          </h3>
          <div
            class="save-indicator"
            :class="{ pending: accountStore.hasPendingAccountSave }"
            :title="saveStatusLabel"
          >
            <i :class="statusIcon.class" :style="statusIcon.style" />
          </div>
        </div>
        <div class="search-row">
          <div class="search-box">
            <i class="pi pi-search search-icon" />
            <InputText
              v-model="search"
              placeholder="Search layouts"
              class="search-input"
              size="small"
            />
          </div>
          <div
            class="actions-group inline"
            role="group"
            aria-label="Layout actions"
          >
            <Button
              icon="pi pi-plus"
              label="New"
              size="small"
              outlined
              @click="openCreate"
            />
            <Button
              icon="pi pi-upload"
              label="Import"
              size="small"
              outlined
              @click="triggerImport"
            />
            <Button
              icon="pi pi-download"
              label="Export All"
              size="small"
              outlined
              @click="exportAllLayouts"
            />
            <input
              ref="fileInput"
              type="file"
              accept="application/json,.json"
              class="hidden-input"
              @change="onFileChange"
            />
          </div>
        </div>
      </div>
      <!-- Layout list -->
      <div class="layouts-scroll">
        <div v-if="filteredLayouts.length === 0" class="empty-state">
          <i class="pi pi-search" /> No layouts found.
        </div>
        <div class="layout-cards" v-else>
          <div
            v-for="layout in filteredLayouts"
            :key="layout.id"
            class="layout-line"
            :class="{ active: layout.id === currentLayoutId }"
            tabindex="0"
            @click="applyLayout(layout)"
            @keydown.enter.prevent="applyLayout(layout)"
            @keydown.space.prevent="applyLayout(layout)"
            @keydown.delete.prevent="confirmDelete(layout)"
          >
            <div
              class="id-color"
              :class="{ active: layout.id === currentLayoutId }"
            />
            <div class="text-block">
              <span class="name" :title="capitalized(layout.name)">
                {{ capitalized(layout.name) }}
              </span>
              <i
                v-if="layout.isDefault"
                class="pi pi-star-fill default-star"
                title="Default layout"
              />
              <span class="sep">•</span>
              <span
                class="desc"
                :class="{ placeholder: !layout.description }"
                :title="layout.description || 'No description'"
              >
                {{ descriptionText(layout) }}
              </span>
              <span class="sep" v-if="lastSavedAgeLabel">•</span>
              <span class="age" v-if="lastSavedAgeLabel">
                {{ lastSavedAgeLabel }}
              </span>
            </div>
            <div class="actions">
              <Button
                icon="pi pi-save"
                rounded
                variant="outlined"
                size="small"
                class="action-btn"
                :pt="{ root: { title: 'Save This Layout' } }"
                @click.stop="saveLayoutState(layout)"
              />
              <Button
                icon="pi pi-refresh"
                rounded
                variant="outlined"
                size="small"
                class="action-btn"
                :pt="{ root: { title: 'Reset Layout (Default Grid)' } }"
                @click.stop="resetLayout(layout)"
              />
              <Button
                v-if="!layout.isDefault"
                icon="pi pi-star"
                rounded
                variant="outlined"
                size="small"
                class="action-btn star-btn"
                @click.stop="toggleStar(layout)"
                :pt="{ root: { title: 'Make Default' } }"
              />
              <Button
                v-else
                icon="pi pi-star-fill"
                rounded
                variant="outlined"
                size="small"
                class="action-btn star-btn active"
                @click.stop="toggleStar(layout)"
                :pt="{ root: { title: 'Default' } }"
              />
              <Button
                icon="pi pi-copy"
                rounded
                variant="outlined"
                size="small"
                class="action-btn"
                @click.stop="duplicateLayout(layout)"
                :pt="{ root: { title: 'Duplicate' } }"
              />
              <Button
                icon="pi pi-pencil"
                rounded
                variant="outlined"
                size="small"
                class="action-btn"
                @click.stop="editLayout(layout)"
                :pt="{ root: { title: 'Edit' } }"
              />
              <Button
                icon="pi pi-download"
                rounded
                variant="outlined"
                size="small"
                class="action-btn"
                @click.stop="exportSingle(layout)"
                :pt="{ root: { title: 'Export' } }"
              />
              <Button
                icon="pi pi-trash"
                rounded
                variant="outlined"
                size="small"
                class="action-btn delete-btn"
                @click.stop="confirmDelete(layout)"
                :pt="{ root: { title: 'Delete' } }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Dialogs -->
      <SaveLayoutDialog
        v-model="editDialog"
        :layoutData="layoutToEdit ?? undefined"
        @layoutSaved="onLayoutSaved"
      />
      <Dialog
        v-model:visible="deleteDialog"
        :modal="true"
        :closable="false"
        :style="{ width: '400px' }"
      >
        <template #header>Confirm Deletion</template>
        <div>Delete layout "{{ layoutToDelete?.name }}"?</div>
        <template #footer>
          <Button label="Cancel" @click="cancelDelete" />
          <Button label="Delete" severity="danger" @click="deleteConfirmed" />
        </template>
      </Dialog>
    </div>
  </Drawer>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
} from "vue";
import SaveLayoutDialog from "@/components/SaveLayoutDialog.vue";
import { useRefStore } from "@/store/RefStore";
import { useAccountStore } from "@/store/AccountStore";
import { DEFAULT_LAYOUT_STATE } from "@/constants/defaultLayout";
import type { Layout } from "@/types";
// PrimeVue components
import Drawer from "primevue/drawer";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Button from "primevue/button";

interface LayoutWithState extends Layout {
  state: unknown;
}

export default defineComponent({
  name: "LayoutPanel",
  components: {
    SaveLayoutDialog,
    Drawer,
    Dialog,
    InputText,
    Button,
  },
  emits: ["layoutSelected", "saveCurrentLayout"],
  setup(_, { emit }) {
    const refStore = useRefStore();
    const accountStore = useAccountStore();
    const layouts = computed(() => accountStore.account?.layouts || []);
    const search = ref("");
    const filteredLayouts = computed(() => {
      const term = search.value.trim().toLowerCase();
      if (!term) return layouts.value;
      return layouts.value.filter((l) =>
        [l.name, l.description].some((v) =>
          v ? String(v).toLowerCase().includes(term) : false
        )
      );
    });
    const currentLayoutId = computed(() => refStore.currentLayoutId);
    const editDialog = ref(false);
    const layoutToEdit = ref<Layout | null>(null);
    const deleteDialog = ref(false);
    const layoutToDelete = ref<Layout | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    // Reactive ticker so relative time updates
    const ageTick = ref(0);
    let ageTimer: number | null = null;
    onMounted(() => {
      ageTimer = window.setInterval(() => {
        ageTick.value++;
      }, 5000);
    });
    onBeforeUnmount(() => {
      if (ageTimer) clearInterval(ageTimer);
    });
    const saveStatusLabel = computed(() => {
      void ageTick.value; // dependency for interval
      const pending = accountStore.hasPendingAccountSave;
      if (pending) return "Saving...";
      const ageMs = accountStore.lastSaveAgeMs;
      if (!isFinite(ageMs)) return "";
      if (ageMs < 1500) return "Saved just now";
      const sec = Math.floor(ageMs / 1000);
      if (sec < 60) return `Saved ${sec}s ago`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `Saved ${min}m ago`;
      const hr = Math.floor(min / 60);
      return `Saved ${hr}h ago`;
    });
    const lastSavedAgeLabel = computed(() =>
      saveStatusLabel.value.replace("Saved", "Updated")
    );
    // Deterministic color for a layout id
    function colorFor(id: string) {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
      }
      const h = hash % 360;
      return `hsl(${h},58%,55%)`;
    }
    const applyLayout = async (layout: Layout) => {
      // Set as active and default in one action
      refStore.setCurrentLayoutId(layout.id);
      await accountStore.setDefaultLayout(layout.id);
      emit("layoutSelected", layout);
    };
    const toggleStar = async (layout: Layout) => {
      // Set as default and also apply it (active)
      await accountStore.setDefaultLayout(layout.id);
      refStore.setCurrentLayoutId(layout.id);
      emit("layoutSelected", layout);
    };
    const editLayout = (layout: Layout) => {
      layoutToEdit.value = { ...layout };
      editDialog.value = true;
    };
    const confirmDelete = (layout: Layout) => {
      layoutToDelete.value = layout;
      deleteDialog.value = true;
    };
    const cancelDelete = () => {
      deleteDialog.value = false;
      layoutToDelete.value = null;
    };
    const deleteConfirmed = async () => {
      if (layoutToDelete.value) {
        await accountStore.deleteLayout(layoutToDelete.value.id);
        // After deletion, select the (new) default or first layout
        const afterLayouts = accountStore.account?.layouts || [];
        const newDefault =
          afterLayouts.find((l) => l.isDefault) || afterLayouts[0];
        if (newDefault) emit("layoutSelected", newDefault as Layout);
      }
      deleteDialog.value = false;
      layoutToDelete.value = null;
    };
    const onLayoutSaved = async (savedLayout: Layout) => {
      // Select the saved layout. Only set default if user chose it.
      if (savedLayout.isDefault) {
        await accountStore.setDefaultLayout(savedLayout.id);
      }
      refStore.setCurrentLayoutId(savedLayout.id);
      editDialog.value = false;
      emit("layoutSelected", savedLayout);
    };
    const exportAllLayouts = () => {
      const json = accountStore.exportLayouts();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `layouts-${new Date()
        .toISOString()
        .replace(/[:]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const triggerImport = () => fileInput.value?.click();
    const onFileChange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        accountStore.importLayoutsFromJson(String(reader.result || ""));
        input.value = "";
      };
      reader.readAsText(file);
    };
    // PrimeVue FileUpload uploader event has shape { files: File|File[] }
    interface FileUploadUploaderEvent {
      files: File | File[];
    }
    const handleUpload = (event: FileUploadUploaderEvent) => {
      const file = Array.isArray(event.files) ? event.files[0] : event.files;
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        accountStore.importLayoutsFromJson(String(reader.result || ""));
      };
      reader.readAsText(file);
    };

    // Duplicate
    const duplicateLayout = async (layout: Layout) => {
      const l = layout as LayoutWithState;
      const clone: LayoutWithState = {
        ...l,
        id: Math.random().toString(36).slice(2, 10),
        name: capitalizeFirst((l.name || "Layout") + " Copy"),
        isDefault: false,
        state: l.state,
      };
      await accountStore.saveLayout(clone);
    };

    // Save current grid state into a specific layout (by emitting to parent)
    const saveLayoutState = async (layout: Layout) => {
      refStore.setCurrentLayoutId(layout.id);
      emit("layoutSelected", layout); // ensure grid loads it first if needed
      emit("saveCurrentLayout"); // parent will capture grid & persist
    };

    // Reset a layout's stored state to DEFAULT_LAYOUT_STATE
    const resetLayout = async (layout: Layout) => {
      const l = layout as LayoutWithState;
      // Replace state with default template
      const saved = await accountStore.saveLayout({
        ...l,
        state: JSON.parse(JSON.stringify(DEFAULT_LAYOUT_STATE)),
      });
      // Make sure it's the active & default layout and apply immediately
      refStore.setCurrentLayoutId(layout.id);
      await accountStore.setDefaultLayout(layout.id);
      emit("layoutSelected", saved || layout);
    };

    const exportSingle = (layout: Layout) => {
      const json = accountStore.exportLayouts([layout.id]);
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(layout.name || "layout").replace(
        /[^a-z0-9_-]/gi,
        "_"
      )}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };

    const openCreate = () => {
      layoutToEdit.value = null;
      editDialog.value = true;
    };
    const statusIcon = computed(() => {
      const pending = accountStore.hasPendingAccountSave;
      return pending
        ? { class: "pi pi-spin pi-spinner", style: "color:#0ea5e9" }
        : { class: "pi pi-check-circle", style: "color:#22c55e" };
    });
    const capitalizeFirst = (s: string) =>
      s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const descriptionText = (layout: Layout) =>
      layout.description && layout.description.trim().length
        ? layout.description
        : "No description";
    const capitalized = (s?: string) => capitalizeFirst(s || "");
    return {
      // core stores & state
      refStore,
      accountStore,
      layouts,
      filteredLayouts,
      currentLayoutId,
      lastSavedAgeLabel,
      saveStatusLabel,
      statusIcon,
      colorFor,
      // ui state
      search,
      editDialog,
      layoutToEdit,
      deleteDialog,
      layoutToDelete,
      fileInput,
      // actions
      applyLayout,
      toggleStar,
      editLayout,
      confirmDelete,
      cancelDelete,
      deleteConfirmed,
      onLayoutSaved,
      exportAllLayouts,
      triggerImport,
      onFileChange,
      handleUpload,
      openCreate,
      duplicateLayout,
      exportSingle,
      saveLayoutState,
      resetLayout,
      // helpers
      capitalized,
      capitalizeFirst,
      descriptionText,
    };
  },
});
</script>

<style scoped>
.layout-drawer {
  padding: 0;
  --gap: 0.75rem;
}
.panel-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.panel-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem var(--gap) 0.4rem;
  border-bottom: 1px solid var(--surface-border);
}
.panel-header .top-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  justify-content: space-between;
  flex-wrap: wrap;
}
.actions-group {
  display: flex;
  align-items: stretch;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.search-row {
  width: 100%;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.search-row .search-box {
  flex: 1 1 auto;
}
.actions-group.inline {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: nowrap;
}
.search-row :deep(.p-inputtext) {
  font-size: 0.75rem;
}
.search-box {
  position: relative;
  width: 100%;
}
.search-box .search-input:deep(.p-inputtext),
.search-box :deep(input.p-inputtext) {
  padding-left: 1.75rem;
  height: 32px;
  line-height: 1.2;
  font-size: 0.75rem;
}
.search-box .search-icon {
  position: absolute;
  top: 50%;
  left: 0.55rem;
  transform: translateY(-50%);
  font-size: 0.8rem;
  pointer-events: none;
  opacity: 0.7;
}
.title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}
.title .count {
  font-weight: 400;
  margin-left: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}
.save-indicator {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-200);
  font-size: 0.8rem;
}
.save-indicator.pending {
  background: #0ea5e9;
  color: #fff;
}
.utilities {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
  padding: 0.6rem var(--gap);
  align-items: center;
  border-bottom: 1px solid var(--surface-border);
}
.utilities .search-wrapper {
  flex: 1 1 200px;
}
.import-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.layouts-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--gap);
}
/* One-line list layout */
.layout-cards {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.layout-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 0.4rem 0.55rem 0.35rem;
  cursor: pointer;
  font-size: 0.7rem;
  line-height: 1.1;
  transition: background 0.15s, border-color 0.15s;
}
.layout-line:not(.active) {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}
.layout-line:not(.active):hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}
.layout-line.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  box-shadow: 0 0 0 1px #10b981 inset;
}
.layout-line:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
.layout-line .id-color {
  width: 4px;
  align-self: stretch;
  border-radius: 3px;
  background: #4b5563; /* gray-600 inactive */
  transition: background 0.15s;
}
.layout-line .id-color.active {
  background: #10b981; /* green for active */
}
.layout-line .text-block {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 0.4rem;
}
.layout-line .name {
  font-weight: 600;
  font-size: 0.75rem;
  max-width: 130px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.layout-line:not(.active) .name,
.layout-line:not(.active) .desc,
.layout-line:not(.active) .age {
  color: #6b7280; /* gray-500 */
}
.layout-line.active .name {
  color: #10b981; /* green-500 */
}
.layout-line.active .desc,
.layout-line.active .age {
  color: #d1d5db; /* light gray for contrast */
}
.layout-line .sep {
  opacity: 0.4;
  font-size: 0.65rem;
}
.layout-line .desc {
  color: var(--text-color-secondary);
  max-width: 170px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.65rem;
}
.layout-line .desc.placeholder {
  font-style: italic;
  opacity: 0.55;
}
.layout-line .age {
  opacity: 0.55;
  font-size: 0.6rem;
  white-space: nowrap;
}
.layout-line .actions {
  display: flex;
  gap: 0.15rem;
  flex-shrink: 0;
}
/* Rounded outlined action buttons */
/* Modern neutral action buttons */
.layout-line .actions :deep(.p-button) {
  width: 30px;
  height: 30px;
  padding: 0.35rem;
  border-radius: 50%;
  font-size: 0.75rem;
  border: 1px solid var(--surface-border);
  background: rgba(255, 255, 255, 0.02);
  color: #9ca3af; /* neutral icon */
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.layout-line .actions :deep(.p-button .pi) {
  font-size: 0.75rem;
}
.layout-line .actions :deep(.p-button:hover) {
  background: rgba(255, 255, 255, 0.07);
  color: #e5e7eb;
  border-color: #6b7280;
}
.layout-line .actions :deep(.p-button:active) {
  background: rgba(255, 255, 255, 0.12);
}
/* Star (default) accent */
.layout-line .actions :deep(.p-button.star-btn) {
  color: #fbbf24;
  border-color: #fbbf24;
}
.layout-line .actions :deep(.p-button.star-btn.active) {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}
.layout-line .actions :deep(.p-button.star-btn:hover) {
  background: rgba(251, 191, 36, 0.18);
  color: #fcd34d;
}
/* Delete danger accent */
.layout-line .actions :deep(.p-button.delete-btn) {
  color: #f87171;
  border-color: #f87171;
}
.layout-line .actions :deep(.p-button.delete-btn:hover) {
  background: rgba(248, 113, 113, 0.15);
  color: #fca5a5;
}
/* Using PrimeVue severity colors now; no custom icon color overrides */
.default-star {
  font-size: 0.85rem;
  color: #eab308;
  margin-left: 0.15rem;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.25));
}
.hidden-input {
  display: none;
}
.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  opacity: 0.7;
  font-size: 0.85rem;
}
@media (max-width: 640px) {
  .layout-cards {
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  }
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .panel-header .right {
    width: 100%;
    justify-content: flex-start;
  }
  .quick-actions {
    flex-direction: row;
  }
}
</style>
