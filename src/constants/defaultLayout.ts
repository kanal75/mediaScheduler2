/* eslint-disable prettier/prettier */
// Shared default grid layout state used for new accounts and new layouts
// Keep in sync with the guest layout shown to not-logged-in users.
export const DEFAULT_LAYOUT_STATE = {
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
} as const;
