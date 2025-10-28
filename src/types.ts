// src/types.ts
export interface Layout {
  id: string;
  name: string;
  description?: string;
  state: unknown; // full grid state object
  isDefault: boolean;
}

export interface HorseStart {
  hnr: string;
  hName: string;
  scratched: boolean;
}

export interface Leg {
  fullName: string;
  legNr: number;
  trackId: string;
  raceNr: string;
  checked: string[];
  starts: HorseStart[];
  textInput: string;
  isAllChecked: boolean;
  indeterminate: boolean;
  timePicker: string[];
}

export interface TrackBetType {
  id: string;
  multiplepooltrackid?: string;
  [key: string]: unknown;
}

export interface SystemFormModel {
  title: string;
  date: string;
  track: string;
  betType: string;
  legs: Leg[];
  path?: string;
  location?: string;
}

export interface NewSchedule {
  id: string;
  profile: string;
  scheduleTypes: string;
  timePicker?: string[];
  priority?: number;
  status?: string;
  specificTime?: boolean;
  specificTimes?: Array<{
    days: string[];
    from: string;
    to: string;
  }>;
  scheduleTags?: string[];
  metaData: SystemFormModel & { [key: string]: any };
}

export interface NewScheduleMeta {
  profile: string;
  scheduleTypes: string;
  metaData: unknown;
}

export interface Tag {
  Id: string;
  BSKEY: string;
  bonsaiXmlDB?: { addTimestamp: string };
}

export interface Group {
  Id: string;
  BSKEY: string;
  Tag?: Tag | Tag[];
}

export interface ScheduleTags {
  Group?: Group | Group[];
}

export interface TreeNode {
  name: string;
  path: string;
  bskey: string;
  children: TreeNode[];
  files: unknown[];
}

export interface Item {
  id: string;
  profile: string;
  bonsaiXmlDB: { addTimestamp: string };
  scheduleTags?: string[];
  timePicker?: string[];
  status?: string;
  metaData?: Record<string, unknown>;
}

export interface Schedule {
  Items?: { Item?: Item | Item[] };
}

export interface AccountSettings {
  isDarkMode: boolean;
  general: {
    sideBar: boolean;
    columnHoverHighlight: boolean;
    pagination: boolean;
    resizableColumns: boolean;
    sorting: boolean;
    filter: boolean;
    floatingFilter: boolean;
  };
}

export interface Account {
  id: string;
  firstName: string;
  lastName?: string;
  layouts: Layout[];
  settings: AccountSettings;
}
