<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    class="save-layout-dialog"
    :closable="true"
    :style="{ width: '20vw' }"
    contentStyle="max-height: 80vh; overflow-y: auto;"
    :baseZIndex="10000"
    :closeOnEscape="true"
    :dismissableMask="true"
    :showHeader="true"
    maximizable
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-save dialog-icon" />
        <span class="headline">{{
          isEditing ? "Edit Layout" : "Save Layout"
        }}</span>
      </div>
    </template>
    <div class="p-fluid dialog-body">
      <div class="p-field">
        <label for="layoutName" class="input-label"
          >Layout Name <span class="required">*</span></label
        >
        <InputText
          id="layoutName"
          v-model="layoutName"
          required
          autofocus
          class="input-text"
          placeholder="Enter layout name"
        />
      </div>
      <div class="p-field">
        <label for="layoutDescription" class="input-label">Description</label>
        <Textarea
          id="layoutDescription"
          v-model="layoutDescription"
          rows="3"
          autoResize
          class="input-textarea"
          placeholder="Optional description"
        />
      </div>
      <div class="p-field-checkbox">
        <Checkbox
          inputId="makeDefault"
          v-model="makeDefault"
          :binary="true"
          class="input-checkbox"
        />
        <label for="makeDefault" class="checkbox-label"
          >Make Default Layout</label
        >
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer flex items-center w-full">
        <div class="flex gap-2">
          <Button
            label="Cancel"
            @click="closeDialog"
            class="p-button-info"
            icon="pi pi-times"
          />
          <Button
            label="Reset"
            @click="resetDialog"
            class="p-button-secondary"
            icon="pi pi-refresh"
          />
        </div>
        <div class="flex-1"></div>
        <Button
          :label="isEditing ? 'Update' : 'Save'"
          :disabled="!layoutName"
          @click="saveLayout"
          icon="pi pi-check"
          class="p-button-primary save-btn"
        />
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, toRaw, watch } from "vue";
import { useAccountStore } from "@/store/AccountStore";
import { useNotificationStore } from "@/store/NotificationStore";
import { useGridStateStore } from "@/store/GridStateStore";
import { Layout } from "@/types";

export default defineComponent({
  name: "SaveLayoutDialog",
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    layoutData: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const accountStore = useAccountStore();
    const notificationStore = useNotificationStore();
    const gridStateStore = useGridStateStore();

    const layoutName = ref("");
    const layoutDescription = ref("");
    const makeDefault = ref(false);

    const isEditing = computed(() => {
      const data = props.layoutData as Layout | null;
      return data && !!data.id;
    });

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (val) => emit("update:modelValue", val),
    });

    watch(
      () => props.layoutData,
      (newVal) => {
        const casted = newVal as Layout | null;
        if (casted) {
          layoutName.value = casted.name || "";
          layoutDescription.value = casted.description || "";
          makeDefault.value = !!casted.isDefault;
        } else {
          layoutName.value = "";
          layoutDescription.value = "";
          makeDefault.value = false;
        }
      },
      { immediate: true }
    );

    const plainGridState = computed(() => {
      return JSON.parse(JSON.stringify(toRaw(gridStateStore.currentState)));
    });

    const closeDialog = () => {
      dialogVisible.value = false;
      layoutName.value = "";
      layoutDescription.value = "";
      makeDefault.value = false;
    };

    const resetDialog = () => {
      layoutName.value = "";
      layoutDescription.value = "";
      makeDefault.value = false;
    };

    const saveLayout = async () => {
      const data = props.layoutData as Layout | null;
      const layoutId = isEditing.value && data ? data.id : "";
      const newLayout: Layout = {
        id: layoutId,
        name: layoutName.value,
        description: layoutDescription.value,
        state: plainGridState.value,
        isDefault: makeDefault.value,
      };

      if (!accountStore.account) {
        notificationStore.showToast({
          severity: "error",
          summary: "Layout",
          detail: "No account found. Please log in.",
          life: 3000,
        });
        closeDialog();
        return;
      }

      try {
        await accountStore.saveLayout(newLayout);
        notificationStore.showToast({
          severity: "success",
          summary: "Layout",
          detail: "Layout saved successfully.",
          life: 3000,
        });
      } catch (error) {
        console.error("Error saving layout:", error);
        notificationStore.showToast({
          severity: "error",
          summary: "Layout",
          detail: "Error saving layout.",
          life: 3000,
        });
      }
      closeDialog();
    };

    return {
      dialogVisible,
      isEditing,
      layoutName,
      layoutDescription,
      makeDefault,
      closeDialog,
      saveLayout,
      resetDialog,
    };
  },
});
</script>

<style scoped>
/* Restore layout and spacing, but do not change colors */
.save-layout-dialog >>> .p-dialog-header {
  border-bottom: none;
}
.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.dialog-icon {
  font-size: 1.5rem;
}
.headline {
  font-size: 1.3rem;
  font-weight: 700;
}
.dialog-body {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.input-label {
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: block;
}
.required {
  font-size: 1rem;
}
.input-text,
.input-textarea {
  width: 100%;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  margin-top: 0.1rem;
  margin-bottom: 0.5rem;
  transition: border-color 0.2s;
}
.input-text:focus,
.input-textarea:focus {
  border-color: var(--primary-color, #2196f3);
  outline: none;
}
.p-field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.checkbox-label {
  font-weight: 500;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
}
.save-btn {
  min-width: 100px;
}
</style>
