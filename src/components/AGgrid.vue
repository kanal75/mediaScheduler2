<template>
  <div class="container">
    <div class="grid-wrapper">
      <ag-grid-vue
        :gridOptions="gridOptions"
        class="grid-container"
        :key="gridKey"
        :rowData="rootStore.schedules"
        :loading="rootStore.isScheduleLoading"
        :statusBar="statusBar"
      ></ag-grid-vue>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import * as agGridCommunity from "ag-grid-community";
import * as agGridEnterprise from "ag-grid-enterprise";
import { AgGridVue } from "ag-grid-vue3";
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

import { useRootStore } from "@/store/RootStore";
import { useRefStore } from "@/store/RefStore";

// Register enterprise features
agGridEnterprise.ModuleRegistry.registerModules([
  agGridEnterprise.AllEnterpriseModule,
  StatusBarModule,
]);

export default defineComponent({
  name: "AGgrid",
  components: {
    AgGridVue,
  },
  setup() {
    const rootStore = useRootStore();
    const refStore = useRefStore();
    const gridKey = ref(0);
    const dateRange = ref([]);

    const darkTheme = agGridCommunity.themeQuartz.withPart(
      agGridCommunity.colorSchemeDark
    );
    const lightTheme = agGridCommunity.themeQuartz.withPart(
      agGridCommunity.colorSchemeLight
    );

    const statusBar = ref<{
      statusPanels: StatusPanelDef[];
    }>({
      statusPanels: [
        { statusPanel: "agTotalAndFilteredRowCountComponent" },
        { statusPanel: "agTotalRowCountComponent" },
        { statusPanel: "agFilteredRowCountComponent" },
        { statusPanel: "agSelectedRowCountComponent" },
        { statusPanel: "agAggregationComponent" },
      ],
    });

    // Set the initial grid options using refStore.isDarkMode
    const gridOptions = ref<agGridCommunity.GridOptions>({
      theme: refStore.isDarkMode ? darkTheme : lightTheme,
      rowSelection: { mode: "multiRow", enableClickSelection: true },
      animateRows: true,
      rowGroupPanelShow: "always",
      sideBar: true,
      detailRowAutoHeight: true,
      suppressNoRowsOverlay: true,
      stopEditingWhenCellsLoseFocus: false,
      loadingOverlayComponent: "CustomLoadingOverlay",
      loadingOverlayComponentParams: {
        loadingMessage: "One moment please...",
      },
      rowHeight: 50,
      headerHeight: 40,
      columnDefs: [
        { field: "profile", filter: "agMultiColumnFilter", maxWidth: 150 },
        { field: "scheduleTypes", maxWidth: 150 },
        {
          field: "status",
          headerName: "Status",
          cellRenderer: StatusCellRender,
          maxWidth: 150,
        },
        {
          field: "priority",
          maxWidth: 200,
          cellRenderer: priorityCellRenderer,
          hide: true,
        },
        {
          field: "timePicker",
          headerName: "Time Range",
          cellRenderer: TimePickerCellRender,
          cellEditor: TimePickerCellEditor,
          editable: true,
          cellEditorPopup: true,
          cellEditorPopupPosition: "under",
        },
        {
          field: "File Information",
          hide: true,
          children: [
            {
              field: "metaData.FileInfo.Created",
              headerName: "Created",
              hide: true,
            },
            {
              field: "metaData.FileInfo.Size",
              headerName: "Size",
              hide: true,
            },
            {
              field: "metaData.FileInfo.Owner",
              headerName: "Owner",
              hide: true,
            },
          ],
        },
        {
          field: "General",
          children: [
            {
              field: "metaData.General.Name",
              headerName: "Name",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.General?.Name || "",
              headerTooltip: "Name",
            },
            {
              field: "metaData.General.Extension",
              headerName: "Extension",
              hide: true,
            },
            {
              field: "metaData.General.FullName",
              headerName: "Full Name",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.General?.FullName || "",
              headerTooltip: "Full Name",
              hide: true,
            },
          ],
        },
        {
          field: "Media Information",
          children: [
            {
              field: "metaData.MediaInfo.Durations[0]",
              headerName: "Durations",
              hide: true,
            },
            {
              field: "metaData.MediaInfo.Size",
              headerName: "Size",
              children: [
                {
                  field: "metaData.MediaInfo.Size.Height",
                  headerName: "Height",
                  hide: true,
                },
                {
                  field: "metaData.MediaInfo.Size.Width",
                  headerName: "Width",
                  hide: true,
                },
              ],
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
            },
            {
              field: "metaData.Url.Play",
              headerName: "Play",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.Url?.Play || "",
              headerTooltip: "Play",
              hide: true,
            },
            {
              field: "metaData.Url.Root",
              headerName: "Root",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.Url?.Root || "",
              headerTooltip: "Root",
              hide: true,
            },
            {
              field: "metaData.Url.Thumbnail",
              headerName: "Thumbnail",
              tooltipValueGetter: (params) =>
                params.data?.metaData?.Url?.Thumbnail || "",
              headerTooltip: "Thumbnail",
              hide: true,
            },
          ],
        },
        {
          field: "scheduleTags",
          headerName: "Tags",
          cellRenderer: TagsCellRenderer,
          cellEditor: TagsCellEditor,
          minWidth: 300,
          editable: true,
        },
        {
          field: "images",
          headerName: "Images",
          cellRenderer: ImagesCellRenderer,
          minWidth: 400,
        },
        {
          field: "metaData.duration",
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
        resizable: true,
        sortable: true,
        filter: true,
        enableRowGroup: true,
        cellStyle: {
          alignItems: "center", // vertical centering
          justifyContent: "center", // horizontal centering
          textAlign: "center", // ensures text is centered
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
      },
    });

    // Watch for changes in refStore.isDarkMode and update the grid's theme accordingly.
    watch(
      () => refStore.isDarkMode,
      (newVal) => {
        gridOptions.value.theme = newVal ? darkTheme : lightTheme;
        gridKey.value++; // Increment key to force re-rendering if necessary
      }
    );

    // Toggle theme function now updates refStore.isDarkMode
    function toggleTheme() {
      // If refStore.isDarkMode is a ref, then you may need to use .value
      // (Depending on your store implementation, adjust accordingly)
      refStore.isDarkMode = !refStore.isDarkMode;
      localStorage.setItem("gridTheme", refStore.isDarkMode ? "dark" : "light");
    }

    return {
      rootStore,
      refStore,
      gridOptions,
      toggleTheme,
      gridKey,
      dateRange,
      statusBar,
    };
  },
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%; /* use full width */
}

.grid-wrapper {
  flex: 1;
  display: flex;
  justify-content: center; /* center horizontally */
  align-items: center; /* center vertically */
}

.grid-container {
  width: 99%;
  height: 97%;
  margin: auto; /* ensures horizontal centering */
}
</style>
