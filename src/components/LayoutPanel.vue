<template>
  <Drawer
    v-model:visible="refStore.showLayoutPanel"
    position="right"
    class="settings-drawer"
    :style="{ width: '400px' }"
  >
    <template #header>
      <span class="text-h6">My Layouts</span>
    </template>
    <Divider />
    <div class="layout-actions d-flex justify-end align-center gap-2 pa-2">
      <Button
        icon="pi pi-plus"
        rounded
        @click="
          editDialog = true;
          layoutToEdit = null;
        "
        v-tooltip.bottom="'Add Layout'"
      />
      <Button
        icon="pi pi-refresh"
        rounded
        severity="info"
        @click="resetToDefaultLayout"
        v-tooltip.bottom="'Reset to Default Layout'"
      />
    </div>
    <div>
      <div
        v-for="layout in layouts"
        :key="layout.id"
        :class="[
          'layout-item',
          { 'selected-layout': layout.id === defaultLayoutId },
        ]"
        @click="selectLayout(layout)"
      >
        <div class="layout-row d-flex align-center justify-between">
          <div class="layout-info">
            <div class="layout-title">{{ layout.name }}</div>
            <div class="layout-desc">{{ layout.description }}</div>
          </div>
          <div class="layout-actions d-flex align-center gap-2">
            <Button
              icon="pi pi-star"
              v-if="layout.isDefault"
              rounded
              severity="success"
              @click.stop="toggleStar(layout)"
              v-tooltip.bottom="'Set as Default'"
            />
            <Button
              icon="pi pi-star"
              v-else
              rounded
              text
              severity="success"
              @click.stop="toggleStar(layout)"
              v-tooltip.bottom="'Set as Default'"
            />
            <Button
              icon="pi pi-pencil"
              rounded
              severity="warning"
              @click.stop="editLayout(layout)"
              v-tooltip.bottom="'Edit Layout'"
            />
            <Button
              icon="pi pi-trash"
              rounded
              severity="danger"
              @click.stop="confirmDelete(layout)"
              v-tooltip.bottom="'Delete Layout'"
            />
          </div>
        </div>
      </div>
    </div>
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
      <div>Are you sure you want to delete "{{ layoutToDelete?.name }}"?</div>
      <template #footer>
        <Button label="Cancel" @click="cancelDelete" />
        <Button label="Delete" severity="danger" @click="deleteConfirmed" />
      </template>
    </Dialog>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import SaveLayoutDialog from "@/components/SaveLayoutDialog.vue";
import { useRefStore } from "@/store/RefStore";
import { useAccountStore } from "@/store/AccountStore";

type Layout = {
  id: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  [key: string]: any;
};

export default defineComponent({
  name: "LayoutPanel",
  components: { SaveLayoutDialog },
  emits: ["layoutSelected"],
  setup(_, { emit }) {
    const refStore = useRefStore();
    const accountStore = useAccountStore();
    const layouts = computed(() => accountStore.account?.layouts || []);
    const defaultLayoutId = computed(() => {
      return accountStore.account?.layouts?.find((layout) => layout.isDefault)
        ?.id;
    });
    const editDialog = ref(false);
    const layoutToEdit = ref<Layout | null>(null);
    const deleteDialog = ref(false);
    const layoutToDelete = ref<Layout | null>(null);
    const selectLayout = async (layout: Layout) => {
      await accountStore.setDefaultLayout(layout.id);
      emit("layoutSelected", layout);
    };
    const toggleStar = async (layout: Layout) => {
      await accountStore.setDefaultLayout(layout.id);
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
      }
      deleteDialog.value = false;
      layoutToDelete.value = null;
    };
    const onLayoutSaved = async (savedLayout: Layout) => {
      await accountStore.setDefaultLayout(savedLayout.id);
      editDialog.value = false;
      emit("layoutSelected", savedLayout);
    };

    // Guest layout state (matches the default grid columns/options for not-logged-in users)
    const guestLayout = {
      name: "Guest Layout",
      state: {
        columnState: [
          { colId: "profile", hide: false },
          { colId: "scheduleTypes", hide: false },
          { colId: "status", hide: false },
          { colId: "priority", hide: true },
          { colId: "timePicker", hide: false },
          { colId: "specificTimes", hide: false },
          { colId: "File Information", hide: true },
          { colId: "General", hide: false },
          { colId: "Media Information", hide: false },
          { colId: "Url", hide: false },
          { colId: "scheduleTags", hide: false },
          { colId: "images", hide: false },
          { colId: "metaData.duration", hide: false },
          { colId: "actions", hide: false },
        ],
        filterModel: {},
        sortModel: [],
        // Add other grid state defaults as needed
      },
    };

    const resetToDefaultLayout = async () => {
      emit("layoutSelected", guestLayout);
    };

    return {
      refStore,
      layouts,
      defaultLayoutId,
      editDialog,
      layoutToEdit,
      deleteDialog,
      layoutToDelete,
      selectLayout,
      toggleStar,
      editLayout,
      confirmDelete,
      cancelDelete,
      deleteConfirmed,
      onLayoutSaved,
      resetToDefaultLayout,
    };
  },
});
</script>

<style scoped>
.settings-drawer {
  z-index: 1300;
}
.text-h6 {
  font-size: 1.25rem;
  font-weight: 600;
}
.layout-item {
  cursor: pointer;
  padding: 8px;
  transition: background-color 0.2s;
  border-radius: 6px;
  margin-bottom: 4px;
}
.layout-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.selected-layout {
  background-color: rgba(0, 150, 136, 0.2);
}
.layout-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.layout-info {
  flex: 1;
}
.layout-title {
  font-weight: 600;
  font-size: 1.1rem;
}
.layout-desc {
  font-size: 0.95rem;
  color: #666;
}
.d-flex {
  display: flex;
}
.gap-2 {
  gap: 8px;
}
</style>
