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
import {
  defineComponent,
  ref,
  watch,
  toRaw,
  computed,
  onMounted,
  nextTick,
} from "vue";
import { AgGridVue } from "ag-grid-vue3";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  RowSelectionModule,
  PaginationModule,
  themeQuartz,
  colorSchemeDark,
  colorSchemeLight,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  type GridApi,
  type GridOptions,
  type GridState,
  type StatusPanelDef,
  type GetContextMenuItemsParams,
  type MenuItemDef,
  type ValueGetterParams,
  type ValueFormatterParams,
  type ValueSetterParams,
  type ITooltipParams,
  type GridReadyEvent,
  type FilterModel,
} from "ag-grid-community";
import {
  RowGroupingModule,
  RowGroupingPanelModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SideBarModule,
  StatusBarModule,
  SetFilterModule,
  AllEnterpriseModule,
} from "ag-grid-enterprise";
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
import type { Item } from "@/types";
import { safeParseLayoutState } from "@/utils/safeParseLayout";
import { areStatesMeaningfullyDifferent } from "@/utils/layoutState";

// Stores
import { useRootStore } from "@/store/RootStore";
import { useRefStore } from "@/store/RefStore";
import { useGridStateStore } from "@/store/GridStateStore";
import { useAccountStore } from "@/store/AccountStore";
import { useNotificationStore } from "@/store/NotificationStore";
import SaveLayoutDialog from "@/components/SaveLayoutDialog.vue";
import { Layout } from "@/types";

// Register AG Grid community and enterprise modules.
ModuleRegistry.registerModules([
  // Community
  ClientSideRowModelModule,
  RowSelectionModule,
  PaginationModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  // Enterprise
  RowGroupingModule,
  RowGroupingPanelModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SideBarModule,
  StatusBarModule,
  SetFilterModule,
  AllEnterpriseModule,
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
    const gridApi = ref<GridApi | null>(null);
    // Local state for capturing grid state.
    type FullGridState = GridState & { filterModel?: FilterModel };
    const state = ref<FullGridState | null>(null);
    // Ref for initializing grid state when loading a saved layout.
    const initialState = ref<FullGridState | undefined>(undefined);
    // Lightweight types for metaData to avoid any
    type MetaDataLite = {
      duration?: unknown;
      MediaInfo?: { Durations?: Array<{ TimeCode?: string }> };
      [key: string]: unknown;
    };
    type ItemWithMeta = Item & { metaData?: MetaDataLite };

    // Ref to skip next layout apply after update
    const skipNextLayoutApply = ref(false); // legacy guard (kept for safety; can remove later)
    const skipLayoutApplyCount = ref(0); // counter for skipping layout apply after self-saves

    // Debug flag (toggle in console: window.__GRID_DEBUG__=true)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const debugEnabled = (window.__GRID_DEBUG__ as boolean) ?? false;
    const dlog = (...args: unknown[]) => {
      if (debugEnabled) {
        // eslint-disable-next-line no-console
        console.log("[AGgrid]", ...args);
      }
    };

    // Layout application flags & revision tracking (must be declared before watchers)
    const isApplyingLayout = ref(false);
    const lastAppliedRevision = ref<number | null>(null);

    // Define themes.
    const darkTheme = themeQuartz.withPart(colorSchemeDark);
    const lightTheme = themeQuartz.withPart(colorSchemeLight);

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
    function getFullGridState(): FullGridState | null {
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
    function setFullGridState(
      state: FullGridState | string | null | undefined
    ) {
      if (!gridApi.value || !state) return;
      // Some backends may return the layout state as a JSON string; parse defensively.
      try {
        if (typeof state === "string") {
          state = JSON.parse(state) as FullGridState;
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[AGgrid] Failed to parse layout state string:", e);
        }
        return;
      }
      isApplyingLayout.value = true;
      // setState is available in newer AG Grid versions; call it if present.
      const apiWithState = gridApi.value as unknown as {
        setState?: (s: unknown) => void;
      };
      apiWithState.setState?.(state as unknown);
      // Delay filter application to ensure grid is ready
      if (
        (state as FullGridState).filterModel &&
        gridApi.value &&
        gridApi.value.setFilterModel
      ) {
        setTimeout(() => {
          if (gridApi.value) {
            gridApi.value.setFilterModel(
              (state as FullGridState).filterModel as FilterModel
            );
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
            isApplyingLayout.value = false;
          } else {
            isApplyingLayout.value = false;
          }
        }, 0);
      } else {
        isApplyingLayout.value = false;
      }
    }

    // Grid options.
    const gridOptions = ref<GridOptions>({
      theme: refStore.isDarkMode ? darkTheme : lightTheme,
      rowSelection: {
        mode: "multiRow",
        enableClickSelection: true,
        // checkboxes provided by explicit column below
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
          valueGetter: (params: ValueGetterParams) =>
            (params.data as Item)?.status, // Ensure grouping uses computed status
          maxWidth: 150,
          enableRowGroup: true,
        },
        {
          field: "priority",
          maxWidth: 200,
          cellRenderer: priorityCellRenderer,
          cellClass: "priority-cell-col",
          editable: () => isLoggedIn.value,
          valueSetter: (params: ValueSetterParams) => {
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
          minWidth: 350,
          maxWidth: 350,
        },
        {
          field: "specificTimes",
          headerName: "Specific Times",
          cellRenderer: SpecificTimesCellRender,
          cellEditor: SpecificTimesCellEditor,
          editable: () => isLoggedIn.value,
          cellEditorPopup: true,
          cellEditorPopupPosition: "under",
          maxWidth: 450,
          cellStyle: {
            alignItems: "flex-start",
            justifyContent: "flex-start",
            textAlign: "left",
          },
        },
        {
          field: "File Information",
          hide: true,
          children: [
            {
              field: "metaData.FileInfo.Created",
              headerName: "Created",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
              },
            },
            {
              field: "metaData.FileInfo.Size",
              headerName: "Size",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
              },
            },
            {
              field: "metaData.FileInfo.Owner",
              headerName: "Owner",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
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
              tooltipValueGetter: (params: ITooltipParams) =>
                params.data?.metaData?.General?.Name || "",
              headerTooltip: "Name",
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
              },
            },
            {
              field: "metaData.General.Extension",
              headerName: "Extension",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
              },
            },
            {
              field: "metaData.General.FullName",
              headerName: "Full Name",
              tooltipValueGetter: (params: ITooltipParams) =>
                params.data?.metaData?.General?.FullName || "",
              headerTooltip: "Full Name",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
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
                  valueFormatter: (params: ValueFormatterParams) => {
                    if (params.value == null) return "";
                    if (typeof params.value === "object")
                      return JSON.stringify(params.value);
                    return params.value as string;
                  },
                },
                {
                  field: "metaData.MediaInfo.Size.Width",
                  headerName: "Width",
                  hide: true,
                  valueFormatter: (params: ValueFormatterParams) => {
                    if (params.value == null) return "";
                    if (typeof params.value === "object")
                      return JSON.stringify(params.value);
                    return params.value as string;
                  },
                },
              ],
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
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
              tooltipValueGetter: (params: ITooltipParams) =>
                params.data?.metaData?.Url?.Download || "",
              headerTooltip: "Download",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
              },
            },
            {
              field: "metaData.Url.Play",
              headerName: "Play",
              tooltipValueGetter: (params: ITooltipParams) =>
                params.data?.metaData?.Url?.Play || "",
              headerTooltip: "Play",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
              },
            },
            {
              field: "metaData.Url.Root",
              headerName: "Root",
              tooltipValueGetter: (params: ITooltipParams) =>
                params.data?.metaData?.Url?.Root || "",
              headerTooltip: "Root",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
              },
            },
            {
              field: "metaData.Url.Thumbnail",
              headerName: "Thumbnail",
              tooltipValueGetter: (params: ITooltipParams) =>
                params.data?.metaData?.Url?.Thumbnail || "",
              headerTooltip: "Thumbnail",
              hide: true,
              valueFormatter: (params: ValueFormatterParams) => {
                if (params.value == null) return "";
                if (typeof params.value === "object")
                  return JSON.stringify(params.value);
                return params.value as string;
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
          valueSetter: (params: ValueSetterParams) => {
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
          // Allow edit only when logged in, and not when MediaInfo has a timecode-derived duration
          editable: (params: { data?: ItemWithMeta }) => {
            if (!isLoggedIn.value) return false;
            const metaData: MetaDataLite = params.data?.metaData ?? {};
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
          valueFormatter: (params: ValueFormatterParams) => {
            return typeof params.value === "object"
              ? JSON.stringify(params.value)
              : (params.value as string);
          },
        },
        {
          field: "actions",
          headerName: "Actions",
          cellRenderer: ActionsCellRenderer,
          maxWidth: 250,
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
      onGridReady(params: GridReadyEvent) {
        gridApi.value = params.api;
        // Clean up gridApi reference when grid is destroyed
        params.api.addEventListener("gridPreDestroyed", () => {
          gridApi.value = null;
        });
        captureGridState();
        gridApi.value.setSideBarVisible(desiredSidebarVisible.value);
        // If there is an initial state (e.g. after refresh), apply it fully (including filters)
        if (initialState.value) {
          isApplyingLayout.value = true;
          setTimeout(() => {
            const init = initialState.value;
            if (init) {
              setFullGridState(init);
            }
          }, 0);
        }
      },
      getContextMenuItems(params: GetContextMenuItemsParams) {
        const menuItems: MenuItemDef[] = [];
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
              const selectedRows = [
                ...(params.api.getSelectedRows() as Item[]),
              ];
              if (selectedRows.length === 0 && params.node?.data) {
                selectedRows.push(params.node.data as Item);
              }
              if (selectedRows.length > 0) {
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
                  const baseIndex = (params.node?.rowIndex ?? 0) + 1;
                  let offset = 0;
                  for (const row of selectedRows) {
                    const newSchedule: Item = {
                      ...row,
                      id: Date.now().toString() + Math.random(),
                    } as Item;
                    params.api.applyTransaction({
                      add: [newSchedule],
                      addIndex: baseIndex + offset,
                    });
                    offset += 1;
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
                const rowsToDelete: Item[] = (() => {
                  // Collect only selected rows that are displayed on the CURRENT PAGE
                  const pageSelected: Item[] = [];
                  const displayedCount = params.api.getDisplayedRowCount();
                  for (let i = 0; i < displayedCount; i++) {
                    const rowNode = params.api.getDisplayedRowAtIndex(i);
                    if (!rowNode) continue;
                    const selected =
                      typeof rowNode.isSelected === "function"
                        ? rowNode.isSelected()
                        : false;
                    if (selected && rowNode.data) {
                      pageSelected.push(rowNode.data as Item);
                    }
                  }
                  if (pageSelected.length > 0) return pageSelected;
                  if (params.node && params.node.data) {
                    return [params.node.data as Item];
                  }
                  return [] as Item[];
                })();

                // Guardrail: if more rows are selected globally than on this page, warn in the confirmation
                const totalSelected = params.api.getSelectedNodes
                  ? params.api.getSelectedNodes().length
                  : params.api.getSelectedRows().length;

                if (
                  rowsToDelete.length > 0 &&
                  window.confirm(
                    `Are you sure you want to delete ${
                      rowsToDelete.length > 1
                        ? rowsToDelete.length + " items"
                        : "this item"
                    }?` +
                      (totalSelected > rowsToDelete.length
                        ? ` (Note: ${totalSelected} selected in total; only ${rowsToDelete.length} on this page will be deleted)`
                        : "")
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
                  for (const row of rowsToDelete) {
                    try {
                      await rootStore.deleteSchedule(row);
                      params.api.applyTransaction({ remove: [row] });
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
            } as MenuItemDef);
          }
        }
        return menuItems;
      },
      onCellValueChanged() {
        captureGridState();
        scheduleLayoutSave();
      },
      onSortChanged() {
        captureGridState();
        scheduleLayoutSave();
      },
      onFilterChanged() {
        captureGridState();
        scheduleLayoutSave();
      },
      onColumnMoved() {
        captureGridState();
        scheduleLayoutSave();
      },
      onColumnResized() {
        captureGridState();
        scheduleLayoutSave();
      },
      onColumnRowGroupChanged() {
        captureGridState();
        scheduleLayoutSave();
      },
      onColumnVisible() {
        captureGridState();
        scheduleLayoutSave();
      },
      onDisplayedColumnsChanged() {
        captureGridState();
        scheduleLayoutSave();
      },
      onColumnPinned() {
        captureGridState();
        scheduleLayoutSave();
      },
      onColumnPivotChanged() {
        captureGridState();
        scheduleLayoutSave();
      },
      onColumnPivotModeChanged() {
        captureGridState();
        scheduleLayoutSave();
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

    const selectedLayoutId = computed(() => refStore.currentLayoutId);
    const layoutsRef = computed(() => accountStore.account?.layouts);

    function applySelectedOrDefaultLayout() {
      if (!accountStore.account || !accountStore.account.layouts) return;
      const selectedId = refStore.currentLayoutId;
      const targetLayout = accountStore.account.layouts.find((l) =>
        selectedId ? l.id === selectedId : !!l.isDefault
      ) as (Layout & { stateRevision?: number }) | undefined;
      if (!targetLayout || !targetLayout.state) return;
      // Migration / normalization: ensure layoutVersion
      const vLayout = targetLayout as Layout & { layoutVersion?: number };
      if (!vLayout.layoutVersion) {
        vLayout.layoutVersion = 1;
        accountStore.queueLayoutsSave();
        dlog("Migrated layoutVersion on apply", vLayout.id);
      }
      // Gate by revision to avoid re-applying identical state
      const revision = targetLayout.stateRevision || 0;
      if (
        lastAppliedRevision.value != null &&
        revision === lastAppliedRevision.value
      ) {
        return; // no change
      }
      const parsed = safeParseLayoutState(targetLayout.state);
      if (!parsed) return;
      isApplyingLayout.value = true;
      setFullGridState(parsed as FullGridState);
      initialState.value = parsed as FullGridState;
      if (!gridApi.value) {
        gridKey.value++;
      }
      lastAppliedRevision.value = revision;
      // Release suppression shortly after apply so debounced updates can resume
      setTimeout(() => {
        isApplyingLayout.value = false;
      }, 50);
    }

    // Defer initial apply until mount to avoid null component hydration race
    onMounted(() => {
      watch(
        [selectedLayoutId, layoutsRef],
        () => {
          if (skipLayoutApplyCount.value > 0) {
            skipLayoutApplyCount.value--;
            return;
          }
          // Ensure grid API is ready or schedule on nextTick
          if (!gridApi.value) {
            nextTick(() => applySelectedOrDefaultLayout());
          } else {
            applySelectedOrDefaultLayout();
          }
        },
        { immediate: true }
      );
    });

    // Remove duplicate declarations later (will rely on these)

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
            let layoutState: FullGridState | string = defaultLayout.state as
              | FullGridState
              | string;
            try {
              if (typeof layoutState === "string") {
                layoutState = JSON.parse(layoutState) as FullGridState;
              }
            } catch (e) {
              if (process.env.NODE_ENV !== "production") {
                // eslint-disable-next-line no-console
                console.warn(
                  "[AGgrid] Could not parse default layout state (late apply):",
                  e
                );
              }
              return;
            }
            setFullGridState(layoutState);
            initialState.value = layoutState as FullGridState;
            gridKey.value++;
            hasAppliedDefaultLayout.value = true;
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log(
                "[AGgrid] Programmatically selected and applied default layout"
              );
            }
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
      // Target the currently selected layout if available; otherwise default
      const selectedId = refStore.currentLayoutId;
      const targetLayout = accountStore.account.layouts.find((l) =>
        selectedId ? l.id === selectedId : !!l.isDefault
      );
      if (!targetLayout) {
        notificationStore.showToast({
          severity: "error",
          summary: "Layout",
          detail: "No layout selected.",
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
      const updatedLayout = { ...targetLayout, state: fullState };
      // Update the account's layouts by replacing the target layout.
      const updatedLayouts = accountStore.account.layouts.map((l) =>
        l.id === targetLayout.id ? updatedLayout : l
      );
      skipNextLayoutApply.value = true;
      accountStore.account.layouts = updatedLayouts;
      // Use queued save infrastructure
      accountStore.queueLayoutsSave();
    };

    interface LayoutWithMeta extends Layout {
      stateRevision?: number;
      __localRevision?: number;
    }
    let localLayoutRevision = 0;
    let initialLayoutPersisted = false;
    // --- Autosave diagnostics (debug only) ---
    const AUTOSAVE_DIAG = {
      gridEvents: 0,
      scheduleCalls: 0,
      debounceFires: 0,
      updateInvocations: 0,
      skippedIsApplying: 0,
      skippedNoApi: 0,
      skippedNoAccount: 0,
      skippedNoLayout: 0,
      skippedNoDiff: 0,
      saved: 0,
      forcedInitial: 0,
      lastDiff: false,
      lastRevision: 0,
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.__GRID_AUTOSAVE = AUTOSAVE_DIAG;
    async function updateCurrentLayoutInternal() {
      AUTOSAVE_DIAG.updateInvocations++;
      if (isApplyingLayout.value) {
        AUTOSAVE_DIAG.skippedIsApplying++;
        return; // don't persist while applying
      }
      if (!gridApi.value) {
        AUTOSAVE_DIAG.skippedNoApi++;
        return;
      }
      if (!accountStore.account || !accountStore.account.layouts) {
        AUTOSAVE_DIAG.skippedNoAccount++;
        return;
      }
      const selectedId = refStore.currentLayoutId;
      const targetLayout = accountStore.account.layouts.find((l) =>
        selectedId ? l.id === selectedId : !!l.isDefault
      ) as LayoutWithMeta | undefined;
      if (!targetLayout) {
        AUTOSAVE_DIAG.skippedNoLayout++;
        return;
      }
      let fullState = getFullGridState();
      if (gridApi.value && gridApi.value.getFilterModel) {
        fullState = {
          ...fullState,
          filterModel: gridApi.value.getFilterModel(),
        };
      }
      // Skip if no meaningful diff from existing (column/filter/sort/group/pivot aspects)
      const diff = areStatesMeaningfullyDifferent(
        targetLayout.state,
        fullState
      );
      if (!diff && !initialLayoutPersisted) {
        dlog("Force initial layout persist");
        AUTOSAVE_DIAG.forcedInitial++;
      } else if (!diff) {
        dlog("Skip save (no meaningful diff)");
        AUTOSAVE_DIAG.skippedNoDiff++;
        AUTOSAVE_DIAG.lastDiff = false;
        return;
      }
      const revision = (targetLayout.stateRevision || 0) + 1;
      // In-place mutation instead of replacing layouts array
      targetLayout.state = fullState;
      targetLayout.__localRevision = ++localLayoutRevision;
      targetLayout.stateRevision = revision;
      skipLayoutApplyCount.value++;
      try {
        // ensure version tagging/migration
        interface VersionedLayout {
          layoutVersion?: number;
        }
        const vTarget = targetLayout as VersionedLayout;
        if (!vTarget.layoutVersion) {
          vTarget.layoutVersion = 1;
          dlog("Applied layoutVersion=1 migration to", targetLayout.id);
        }
        accountStore.queueLayoutsSave();
        dlog("Queued layout revision", revision, {
          diffForced: !diff && !initialLayoutPersisted,
        });
        initialLayoutPersisted = true;
        AUTOSAVE_DIAG.saved++;
        AUTOSAVE_DIAG.lastDiff = true;
        AUTOSAVE_DIAG.lastRevision = revision;
      } catch {
        // toast handled in store
      }
    }
    // Micro-batch + debounce persistence
    let pendingSave = false;
    let debounceTimer: number | null = null;
    const DEBOUNCE_MS = 600;
    let scheduleLayoutSave = function scheduleLayoutSaveBase() {
      if (isApplyingLayout.value) return;
      pendingSave = true;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(async () => {
        if (!pendingSave) return;
        pendingSave = false;
        AUTOSAVE_DIAG.debounceFires++;
        await updateCurrentLayoutInternal();
      }, DEBOUNCE_MS);
    };

    // Expose manual trigger for debugging
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.__SAVE_LAYOUT = () => updateCurrentLayoutInternal();
    // Allow forcing immediate persisted state (bypasses debounce) for debugging
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.__SAVE_LAYOUT_NOW = () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      pendingSave = false;
      updateCurrentLayoutInternal();
    };

    // Idle flush: if no further grid events for IDLE_FLUSH_MS after a pending change, force save
    const IDLE_FLUSH_MS = 5000;
    let idleTimer: number | null = null;
    function armIdleFlush() {
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (pendingSave) {
          // run immediate save
          if (debounceTimer) {
            window.clearTimeout(debounceTimer);
            debounceTimer = null;
          }
          pendingSave = false;
          updateCurrentLayoutInternal();
        }
      }, IDLE_FLUSH_MS);
    }

    // Wrap original schedule to also arm idle flush
    const _origSchedule = scheduleLayoutSave;
    scheduleLayoutSave = function wrappedScheduleLayoutSave() {
      AUTOSAVE_DIAG.scheduleCalls++;
      _origSchedule();
      armIdleFlush();
    };

    // Flush on page visibility loss / unload (best-effort)
    function flushIfPending() {
      if (pendingSave) {
        if (debounceTimer) {
          window.clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        pendingSave = false;
        updateCurrentLayoutInternal();
      }
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushIfPending();
    });
    window.addEventListener("beforeunload", flushIfPending);

    // Ensure an initial baseline save occurs shortly after grid ready if none yet persisted
    // (In case the diff logic considered initial identical to stored state and skipped)
    setTimeout(() => {
      if (!initialLayoutPersisted) {
        pendingSave = true;
        flushIfPending();
      }
    }, 1500);
    watch(
      () => state.value,
      () => {
        if (skipNextLayoutApply.value) {
          skipNextLayoutApply.value = false;
          return;
        }
        AUTOSAVE_DIAG.gridEvents++;
        scheduleLayoutSave();
      },
      { deep: true }
    );
    const lastAppliedLayoutId = ref<string | null>(null);
    const onLayoutSelected = (layout: Layout) => {
      refStore.setCurrentLayoutId(layout.id);
      const cast = layout as Layout & { stateRevision?: number };
      let layoutState: FullGridState | string = cast.state as
        | FullGridState
        | string;
      try {
        if (typeof layoutState === "string") {
          layoutState = JSON.parse(layoutState) as FullGridState;
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[AGgrid] Could not parse selected layout state:", e);
        }
        return;
      }
      const newRevision = cast.stateRevision || 0;
      if (
        lastAppliedRevision.value != null &&
        newRevision === lastAppliedRevision.value &&
        lastAppliedLayoutId.value === cast.id
      ) {
        return; // already applied this layout revision
      }
      isApplyingLayout.value = true;
      setFullGridState(layoutState as FullGridState);
      initialState.value = layoutState as FullGridState;
      if (!gridApi.value) {
        gridKey.value++;
      }
      lastAppliedRevision.value = newRevision;
      lastAppliedLayoutId.value = cast.id;
      setTimeout(() => (isApplyingLayout.value = false), 50);
    };

    const isLoggedIn = computed(() => !!accountStore.account);

    // (declarations moved earlier)

    expose({ onLayoutSelected, openSaveDialog, updateCurrentLayout });
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
      lastAppliedRevision,
      isApplyingLayout,
      isLoggedIn,
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
