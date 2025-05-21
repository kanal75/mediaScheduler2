<template>
  <div class="container">
    <div class="grid-wrapper">
      <div class="grid-scroll-area">
        <!-- AG Grid -->
        <ag-grid-vue
          :gridOptions="gridOptions"
          class="ag-theme-alpine grid-container"
          :key="gridKey"
          :rowData="rootStore.schedules"
          :loading="rootStore.isScheduleLoading"
          :statusBar="statusBar"
          :initialState="initialState"
        ></ag-grid-vue>
      </div>
    </div>
    <!-- Save Layout Dialog -->
    <saveLayoutDialog v-model="saveDialog" :gridState="currentGridState" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, toRaw, computed } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import * as agGridCommunity from "ag-grid-community";
import * as agGridEnterprise from "ag-grid-enterprise";
import { StatusPanelDef } from "ag-grid-community";
import { StatusBarModule } from "ag-grid-enterprise";
import CustomLoadingOverlay from "@/components/CustomLoadingOverlay.vue";
import StatusCellRender from "@/components/cellRender/StatusCellRender.vue";
import priorityCellRenderer from "@/components/cellRender/priorityCellRenderer.vue";
import ImagesCellRenderer from "@/components/cellRender/ImagesCellRenderer.vue";
import TimePickerCellRender from "@/components/cellRender/TimePickerCellRender.vue";
import TimePickerCellEditor from "@/components/cellRender/TimePickerCellEditor.vue";
import TagsCellRenderer from "@/components/cellRender/TagsCellRenderer.vue";
import TagsCellEditor from "@/components/cellRender/TagsCellEditor.vue";
import ActionsCellRenderer from "@/components/cellRender/ActionsCellRenderer.vue";
import SpecificTimesCellRender from "@/components/cellRender/SpecificTimesCellRender.vue";
import SpecificTimesCellEditor from "@/components/cellRender/SpecificTimesCellEditor.vue";
import DurationCellEditor from "@/components/cellRender/DurationCellEditor.vue";
import DurationCellRender from "@/components/cellRender/DurationCellRender.vue";

// Stores
import { useRootStore } from "@/store/RootStore";
import { useRefStore } from "@/store/RefStore";
import { useGridStateStore } from "@/store/GridStateStore";
import { useAccountStore } from "@/store/AccountStore";
import { useNotificationStore } from "@/store/NotificationStore";
import SaveLayoutDialog from "@/components/SaveLayoutDialog.vue";
import { Layout } from "@/types";

// Register enterprise modules.
agGridEnterprise.ModuleRegistry.registerModules([
  agGridEnterprise.AllEnterpriseModule,
  StatusBarModule,
]);

export default defineComponent({
  name: "AGgrid",
  components: {
    AgGridVue,
    SaveLayoutDialog,
  },
  setup(_, { expose }) {
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const gridStateStore = useGridStateStore();
    const accountStore = useAccountStore();
    const notificationStore = useNotificationStore();

    const gridKey = ref(0);
    const saveDialog = ref(false);
    const openSaveDialog = () => {
      saveDialog.value = true;
    };

    // Reference to the grid API.
    const gridApi = ref<any>(null);
    // Local state for capturing grid state.
    const state = ref<any>(null);
    // Ref for initializing grid state when loading a saved layout.
    const initialState = ref(undefined);

    // Ref to skip next layout apply after update
    const skipNextLayoutApply = ref(false);

    // Loading overlay for layout/filters
    const isLayoutApplying = ref(false);

    // Define themes.
    const darkTheme = agGridCommunity.themeQuartz.withPart(
      agGridCommunity.colorSchemeDark
    );
    const lightTheme = agGridCommunity.themeQuartz.withPart(
      agGridCommunity.colorSchemeLight
    );

    const statusBar = ref<{ statusPanels: StatusPanelDef[] }>({
      statusPanels: [
        { statusPanel: "agTotalAndFilteredRowCountComponent" },
        { statusPanel: "agTotalRowCountComponent" },
        { statusPanel: "agFilteredRowCountComponent" },
        { statusPanel: "agSelectedRowCountComponent" },
        { statusPanel: "agAggregationComponent" },
      ],
    });

    // Capture grid state safely.
    const captureGridState = () => {
      if (gridApi.value) {
        const newState = gridApi.value.getState();
        if (newState === undefined) return;
        const rawState = JSON.parse(JSON.stringify(toRaw(newState)));
        state.value = rawState;
        gridStateStore.updateState(rawState);
      }
    };

    // Save and restore full grid state (columns, filters, sort, etc.)
    // Use AG Grid's getState and apply state best practices
    function getFullGridState() {
      if (!gridApi.value || gridApi.value.isDestroyed?.()) return null;
      // AG Grid 31+ getState returns full state (columns, filters, sort, group, pin, etc.)
      // But for filters, explicitly include filterModel for reliability
      return {
        ...(gridApi.value.getState ? gridApi.value.getState() : {}),
        filterModel: gridApi.value.getFilterModel
          ? gridApi.value.getFilterModel()
          : undefined,
      };
    }
    function setFullGridState(state: any) {
      if (!gridApi.value || !state) return;
      isLayoutApplying.value = true;
      if (gridApi.value.setState) {
        gridApi.value.setState(state);
      }
      // Delay filter application to ensure grid is ready
      if (state.filterModel && gridApi.value && gridApi.value.setFilterModel) {
        setTimeout(() => {
          if (gridApi.value) {
            gridApi.value.setFilterModel(state.filterModel);
            if (gridApi.value.onFilterChanged) {
              gridApi.value.onFilterChanged();
            }
            if (gridApi.value.refreshCells) {
              gridApi.value.refreshCells({ force: true });
            }
            if (gridApi.value.redrawRows) {
              gridApi.value.redrawRows();
            }
            // Hide loading overlay after filters are applied
            isLayoutApplying.value = false;
          } else {
            isLayoutApplying.value = false;
          }
        }, 0);
      } else {
        isLayoutApplying.value = false;
      }
    }

    // Grid options.
    const gridOptions = ref<agGridCommunity.GridOptions>({
      theme: refStore.isDarkMode ? darkTheme : lightTheme,
      rowSelection: {
        mode: "multiRow",
        enableClickSelection: true,
        checkboxes: true,
      },
      animateRows: true,
      pagination: accountStore.account?.settings.general.pagination || false,
      rowGroupPanelShow: "always",
      sideBar: accountStore.account?.settings.general.sideBar || false,
      columnHoverHighlight:
        accountStore.account?.settings.general.columnHoverHighlight || true,
      detailRowAutoHeight: true,
      suppressNoRowsOverlay: true,
      stopEditingWhenCellsLoseFocus: false,
      loadingOverlayComponent: "CustomLoadingOverlay",
      loadingOverlayComponentParams: {
        loadingMessage: "One moment please...",
      },
      rowHeight: 60,
      headerHeight: 40,
      columnDefs: [
        { field: "profile", maxWidth: 150 },
        { field: "scheduleTypes", maxWidth: 150 },
        {
          field: "status",
          headerName: "Status",
          cellRenderer: StatusCellRender,
          valueGetter: (params) => params.data?.status, // Ensure grouping uses computed status
          maxWidth: 150,
          enableRowGroup: true,
        },
        {
          field: "priority",
          maxWidth: 200,
          cellRenderer: priorityCellRenderer,
          editable: () => isLoggedIn.value,
          valueSetter: (params) => {
            params.data.priority = params.newValue;
            rootStore.upsertSchedule(params.data);
            return true;
          },
          hide: true,
        },
        {
          field: "timePicker",
          headerName: "Time Range",
          cellRenderer: TimePickerCellRender,
          cellEditor: TimePickerCellEditor,
          editable: () => isLoggedIn.value,
          cellEditorPopup: true,
          cellEditorPopupPosition: "under",
        },
        {
          field: "specificTimes",
          headerName: "Specific Times",
          cellRenderer: SpecificTimesCellRender,
          cellEditor: SpecificTimesCellEditor,
          editable: () => isLoggedIn.value,
          cellEditorPopup: true,
          cellEditorPopupPosition: "under",
          maxWidth: 200,
        },
        {
          field: "File Information",
          hide: true,
          children: [
            {
              field: "metaData.FileInfo.Created",
              headerName: "Created",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
            {
              field: "metaData.FileInfo.Size",
              headerName: "Size",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
            {
              field: "metaData.FileInfo.Owner",
              headerName: "Owner",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
          ],
        },
        {
          field: "General",
          children: [
            {
              field: "metaData.General.Name",
              headerName: "Name",
              hide: true,
              tooltipValueGetter: (params) =>
                params.data?.metaData?.General?.Name || "",
              headerTooltip: "Name",
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
            {
              field: "metaData.General.Extension",
              headerName: "Extension",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
            {
              field: "metaData.General.FullName",
              headerName: "Full Name",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.General?.FullName || "",
              headerTooltip: "Full Name",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
          ],
        },
        {
          field: "Media Information",
          children: [
            {
              field: "metaData.MediaInfo.Size",
              headerName: "Size",
              children: [
                {
                  field: "metaData.MediaInfo.Size.Height",
                  headerName: "Height",
                  hide: true,
                  valueFormatter: (params) => {
                    if (params.value == null) return "";
                    if (typeof params.value === "object")
                      return JSON.stringify(params.value);
                    return params.value;
                  },
                },
                {
                  field: "metaData.MediaInfo.Size.Width",
                  headerName: "Width",
                  hide: true,
                  valueFormatter: (params) => {
                    if (params.value == null) return "";
                    if (typeof params.value === "object")
                      return JSON.stringify(params.value);
                    return params.value;
                  },
                },
              ],
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
          ],
        },
        {
          field: "Url",
          children: [
            {
              field: "metaData.Url.Download",
              headerName: "Download",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.Url?.Download || "",
              headerTooltip: "Download",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
            {
              field: "metaData.Url.Play",
              headerName: "Play",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.Url?.Play || "",
              headerTooltip: "Play",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
            {
              field: "metaData.Url.Root",
              headerName: "Root",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.Url?.Root || "",
              headerTooltip: "Root",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
            {
              field: "metaData.Url.Thumbnail",
              headerName: "Thumbnail",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.Url?.Thumbnail || "",
              headerTooltip: "Thumbnail",
              hide: true,
              valueFormatter: (params) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value;
              },
            },
          ],
        },
        {
          field: "scheduleTags",
          headerName: "Tags",
          cellRenderer: TagsCellRenderer,
          cellEditor: TagsCellEditor,
          minWidth: 400,
          editable: () => isLoggedIn.value,
          valueSetter: (params) => {
            params.data.scheduleTags = params.newValue;
            rootStore.updateScheduleTags(params.data.id, params.newValue);
            return true;
          },
        },
        {
          field: "images",
          headerName: "Images",
          cellRenderer: ImagesCellRenderer,
          minWidth: 400,
        },
        {
          field: "metaData.duration",
          headerName: "Duration",
          cellRenderer: DurationCellRender,
          cellEditor: DurationCellEditor,
          minWidth: 180,
          editable: (params) => {
            if (!isLoggedIn.value) return false;
            const metaData = params.data?.metaData || {};
            // If MediaInfo.Durations[0].TimeCode exists and no metaData.duration, duration is read-only
            if (
              metaData.MediaInfo &&
              Array.isArray(metaData.MediaInfo.Durations) &&
              metaData.MediaInfo.Durations[0]?.TimeCode &&
              !metaData.duration
            ) {
              return false;
            }
            return true;
          },
          valueFormatter: (params) =>
            typeof params.value === "object"
              ? JSON.stringify(params.value)
              : params.value,
        },
        {
          field: "actions",
          headerName: "Actions",
          cellRenderer: ActionsCellRenderer,
          maxWidth: 150,
        },
      ],
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        resizable:
          accountStore.account?.settings.general.resizableColumns || true,
        sortable: accountStore.account?.settings.general.sorting || true,
        filter: accountStore.account?.settings.general.filter || true,
        floatingFilter:
          accountStore.account?.settings.general.floatingFilter || false,
        enableRowGroup: true,
        cellStyle: {
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        },
      },
      components: {
        CustomLoadingOverlay,
        StatusCellRender,
        priorityCellRenderer,
        ImagesCellRenderer,
        TimePickerCellRender,
        TimePickerCellEditor,
        TagsCellRenderer,
        TagsCellEditor,
        ActionsCellRenderer,
        SpecificTimesCellRender,
        SpecificTimesCellEditor,
        DurationCellEditor,
        DurationCellRender,
      },
      onGridReady(params) {
        gridApi.value = params.api;
        // Clean up gridApi reference when grid is destroyed
        params.api.addEventListener("gridPreDestroyed", () => {
          gridApi.value = null;
        });
        captureGridState();
        gridApi.value.setSideBarVisible(desiredSidebarVisible.value);
        // If there is an initial state (e.g. after refresh), apply it fully (including filters)
        if (initialState.value) {
          isLayoutApplying.value = true;
          setTimeout(() => {
            setFullGridState(initialState.value);
          }, 0);
        }
      },
      getContextMenuItems(params: any) {
        const menuItems: import("ag-grid-community").MenuItemDef[] = [];
        // Only allow duplicate/delete if user is logged in
        if (accountStore.account) {
          // Duplicate Selected Row(s)
          menuItems.push({
            name:
              params.api.getSelectedRows().length > 1
                ? "Duplicate Selected Rows"
                : "Duplicate Row",
            icon: '<span class="ag-icon ag-icon-copy"></span>',
            action: async () => {
              const selectedRows = params.api.getSelectedRows();
              if (
                selectedRows.length === 0 &&
                params.node &&
                params.node.data
              ) {
                selectedRows.push(params.node.data);
              }
              if (selectedRows.length > 0) {
                // Show a confirmation dialog before duplicateing
                const confirmMsg =
                  selectedRows.length > 1
                    ? `Are you sure you want to duplicate ${selectedRows.length} items?`
                    : "Are you sure you want to duplicate this item?";
                if (window.confirm(confirmMsg)) {
                  notificationStore.showToast({
                    severity: "info",
                    summary: "duplicate Confirmation",
                    detail:
                      selectedRows.length > 1
                        ? `Duplicateing ${selectedRows.length} items...`
                        : "Duplicateing this item...",
                    life: 2000,
                  });
                  for (const row of selectedRows) {
                    const currentRowIndex =
                      params.api.getRowNode(row.id)?.rowIndex ??
                      params.node.rowIndex;
                    const newSchedule = {
                      ...row,
                      id: Date.now().toString() + Math.random(),
                    };
                    params.api.applyTransaction({
                      add: [newSchedule],
                      addIndex: currentRowIndex + 1,
                    });
                    await rootStore.upsertSchedule(newSchedule);
                  }
                  notificationStore.showToast({
                    severity: "success",
                    summary: "Cuplicate ",
                    detail:
                      selectedRows.length > 1
                        ? "Rows copied successfully."
                        : "Row copied successfully.",
                    life: 3000,
                  });
                } else {
                  notificationStore.showToast({
                    severity: "info",
                    summary: "Duplicate",
                    detail: "Duplicate cancelled.",
                    life: 2000,
                  });
                }
              }
            },
          });
          // Delete Selected Rows
          if (
            params.node &&
            (params.api.getSelectedRows().length > 0 || params.node.data)
          ) {
            menuItems.push({
              name:
                params.api.getSelectedRows().length > 1
                  ? "Delete Selected Rows"
                  : "Delete Row",
              icon: '<span style="display:inline-flex;align-items:center;"><span class="v-icon notranslate mdi mdi-delete-outline" style="font-size:16px;"></span></span>',
              action: async () => {
                const rowsToDelete =
                  params.api.getSelectedRows().length > 0
                    ? params.api.getSelectedRows()
                    : params.node && params.node.data
                    ? [params.node.data]
                    : [];
                if (
                  rowsToDelete.length > 0 &&
                  window.confirm(
                    `Are you sure you want to delete ${
                      rowsToDelete.length > 1
                        ? rowsToDelete.length + " items"
                        : "this item"
                    }?`
                  )
                ) {
                  notificationStore.showToast({
                    severity: "info",
                    summary: "Delete Confirmation",
                    detail: `Deleting ${
                      rowsToDelete.length > 1
                        ? rowsToDelete.length + " items"
                        : "this item"
                    }...`,
                    life: 2000,
                  });
                  // Sequentially delete each row to avoid overloading the server
                  for (const row of rowsToDelete) {
                    try {
                      await rootStore.deleteSchedule(row); // Wait for each delete to finish
                      params.api.applyTransaction({ remove: [row] }); // Remove from grid only after successful delete
                    } catch (e) {
                      notificationStore.showToast({
                        severity: "error",
                        summary: "Delete",
                        detail: "Error deleting schedule.",
                        life: 3000,
                      });
                    }
                  }
                  notificationStore.showToast({
                    severity: "success",
                    summary: "Delete",
                    detail:
                      rowsToDelete.length > 1
                        ? "Rows deleted."
                        : "Row deleted.",
                    life: 3000,
                  });
                }
              },
            } as import("ag-grid-community").MenuItemDef);
          }
        }
        return menuItems;
      },
      onCellValueChanged() {
        captureGridState();
        updateCurrentLayout();
      },
      onSortChanged() {
        captureGridState();
        updateCurrentLayout();
      },
      onFilterChanged() {
        captureGridState();
        updateCurrentLayout();
      },
      onColumnMoved() {
        captureGridState();
        updateCurrentLayout();
      },
      onColumnResized() {
        captureGridState();
        updateCurrentLayout();
      },
      onColumnRowGroupChanged() {
        captureGridState();
        updateCurrentLayout();
      },
    });

    // Track desired sidebar state in case gridApi is not ready
    const desiredSidebarVisible = ref(
      !!accountStore.account?.settings.general.sideBar
    );

    // Watch for dark mode changes.
    watch(
      () => refStore.isDarkMode,
      (newVal) => {
        gridOptions.value.theme = newVal ? darkTheme : lightTheme;
        gridKey.value++;
      }
    );

    // Deep watch for account changes.
    watch(
      () => accountStore.account,
      (account, _prev, onCleanup) => {
        if (skipNextLayoutApply.value) {
          skipNextLayoutApply.value = false;
          return;
        }
        if (account) {
          const defaultLayout = account.layouts?.find((l) => l.isDefault);
          if (defaultLayout && defaultLayout.state) {
            if (gridApi.value && typeof gridApi.value.setState === "function") {
              gridApi.value.setState(defaultLayout.state);
              // After login/refresh, apply layout again to ensure all state (like filters) is applied
              setTimeout(async () => {
                await setFullGridState(defaultLayout.state);
              }, 0);
            } else {
              initialState.value = defaultLayout.state;
              gridKey.value++;
            }
          } else {
            initialState.value = undefined;
            gridKey.value++;
            console.log(
              "No default layout found; reverting to original layout"
            );
          }
        } else {
          initialState.value = undefined;
          gridKey.value++;
        }
      },
      { immediate: true, deep: true }
    );

    // Watch for changes in account settings to update grid options and sidebar
    watch(
      () => accountStore.account?.settings.general,
      (newGeneral) => {
        if (!newGeneral) return;
        gridOptions.value.sideBar = newGeneral.sideBar;
        desiredSidebarVisible.value = !!newGeneral.sideBar;
        if (gridApi.value) {
          gridApi.value.setSideBarVisible(!!newGeneral.sideBar);
        }
        gridOptions.value.columnHoverHighlight =
          newGeneral.columnHoverHighlight;
        gridOptions.value.pagination = newGeneral.pagination;
        if (gridOptions.value.defaultColDef) {
          gridOptions.value.defaultColDef.resizable =
            newGeneral.resizableColumns;
          gridOptions.value.defaultColDef.sortable = newGeneral.sorting;
          gridOptions.value.defaultColDef.filter = newGeneral.filter;
          gridOptions.value.defaultColDef.floatingFilter =
            newGeneral.floatingFilter;
        }
        // Force grid to re-render with new options
        gridKey.value++;
      },
      { deep: true }
    );

    // After grid and data are loaded, programmatically select and apply the default layout
    const hasAppliedDefaultLayout = ref(false);
    watch(
      [() => gridApi.value, () => rootStore.schedules],
      ([api, schedules]) => {
        if (
          api &&
          schedules &&
          Array.isArray(schedules) &&
          schedules.length > 0 &&
          accountStore.account &&
          accountStore.account.layouts &&
          !hasAppliedDefaultLayout.value
        ) {
          const defaultLayout = accountStore.account.layouts.find(
            (l) => l.isDefault
          );
          if (defaultLayout && defaultLayout.state) {
            setFullGridState(defaultLayout.state);
            initialState.value = defaultLayout.state;
            gridKey.value++;
            hasAppliedDefaultLayout.value = true;
            console.log(
              "[AGgrid] Programmatically selected and applied default layout"
            );
          }
        }
      },
      { immediate: false }
    );

    // Update current layout with the current grid state.
    const updateCurrentLayout = async () => {
      if (!gridApi.value) return;
      if (!accountStore.account || !accountStore.account.layouts) {
        return;
      }
      const defaultLayout = accountStore.account.layouts.find(
        (l) => l.isDefault
      );
      if (!defaultLayout) {
        notificationStore.showToast({
          severity: "error",
          summary: "Layout",
          detail: "No default layout selected.",
          life: 3000,
        });
        return;
      }
      // Save full grid state using AG Grid's getState
      let fullState = getFullGridState();
      // Always update filterModel to the latest before saving
      if (gridApi.value && gridApi.value.getFilterModel) {
        fullState = {
          ...fullState,
          filterModel: gridApi.value.getFilterModel(),
        };
      }
      const updatedLayout = { ...defaultLayout, state: fullState };
      // Update the account's layouts by replacing the default layout.
      const updatedLayouts = accountStore.account.layouts.map((l) =>
        l.id === defaultLayout.id ? updatedLayout : l
      );
      skipNextLayoutApply.value = true;
      accountStore.account.layouts = updatedLayouts;
      await accountStore.putAccount(accountStore.account);
    };

    // Expose onLayoutSelected so that the parent component can call it.
    const onLayoutSelected = (layout: Layout) => {
      setFullGridState(layout.state);
      initialState.value = layout.state;
      gridKey.value++;
    };
    expose({ onLayoutSelected, openSaveDialog });
    const isLoggedIn = computed(() => !!accountStore.account);
    return {
      rootStore,
      refStore,
      gridOptions,
      gridKey,
      statusBar,
      updateCurrentLayout,
      state,
      initialState,
      accountStore,
      saveDialog,
      currentGridState: gridStateStore.currentState,
      openSaveDialog,
      isLayoutApplying,
    };
  },
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 95vh;
  width: 100%;
  overflow: hidden;
}
.grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.grid-scroll-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.grid-container {
  flex: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: auto;
}
</style>
