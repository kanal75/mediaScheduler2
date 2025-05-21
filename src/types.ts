// src/types.ts
export interface Layout {
  id: string;
  name: string;
  description?: string;
  state: any; // full grid state object
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
  [key: string]: any;
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
  specificTimes?: Array<[string, string]>;
  scheduleTags?: string[];
  metaData: SystemFormModel & { [key: string]: any };
}

export interface NewScheduleMeta {
  profile: string;
  scheduleTypes: string;
  metaData: any;
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
  files: any[];
}

export interface Item {
  id: string;
  profile: string;
  bonsaiXmlDB: { addTimestamp: string };
  scheduleTags?: string[];
  timePicker?: string[];
  status?: string;
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
