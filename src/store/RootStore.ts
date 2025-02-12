import { defineStore } from "pinia";
import axios from "axios";
import moment from "moment";

// Define your API base URL based on the environment
const isProd = process.env.NODE_ENV === "production";
const baseURL = isProd
  ? "ROOT/MEDIASCHEDULER/"
  : "http://127.0.0.1/ROOT/MEDIASCHEDULER/";

// Define TypeScript Interfaces for type safety
interface BonsaiXmlDB {
  addTimestamp: string;
}

interface Item {
  bonsaiXmlDB: BonsaiXmlDB;
}

interface Schedule {
  Items?: {
    Item?: Item | Item[];
  };
}

interface Tag {
  Id: string;
  BSKEY: string;
  bonsaiXmlDB: {
    addTimestamp: string;
  };
}

interface Group {
  Id: string;
  BSKEY: string;
  Tag?: Tag | Tag[];
}

interface ScheduleTags {
  Group?: Group | Group[];
}

export const useRootStore = defineStore("RootStore", {
  state: (): {
    schedules: Item[];
    isScheduleLoading: boolean;
    scheduleTagsGroups: Group[];
    isTagsLoading: boolean;
    editingScheduleId: string | null;
  } => ({
    schedules: [],
    isScheduleLoading: true,
    scheduleTagsGroups: [],
    isTagsLoading: false,
    editingScheduleId: null,
  }),

  actions: {
    async fetchSchedules() {
      this.isScheduleLoading = true;
      try {
        const response = await axios.get<Schedule[]>(
          `${baseURL}Schedules?type=copy`
        );
        this.setSchedules(response.data);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      } finally {
        this.isScheduleLoading = false;
      }
    },

    setSchedules(schedules: Schedule | Schedule[]) {
      const tempArray: Item[] = [];

      const handleItems = (items?: Item | Item[]) => {
        if (!items) return;
        if (Array.isArray(items)) {
          tempArray.push(...items);
        } else {
          tempArray.push(items);
        }
      };

      if (Array.isArray(schedules)) {
        for (const schedule of schedules) {
          handleItems(schedule?.Items?.Item);
        }
      } else {
        handleItems(schedules?.Items?.Item);
      }

      // Sort schedules by `addTimestamp`
      this.schedules = tempArray.sort(
        (a, b) =>
          moment(a.bonsaiXmlDB.addTimestamp).valueOf() -
          moment(b.bonsaiXmlDB.addTimestamp).valueOf()
      );
    },

    async fetchScheduleTagsGroups() {
      this.isTagsLoading = true;
      try {
        const response = await axios.get<ScheduleTags>(
          `${baseURL}ScheduleTags?type=copy`
        );
        this.setScheduleTagsGroups(response.data);
      } catch (error) {
        console.error("Error fetching schedule tags groups:", error);
      } finally {
        this.isTagsLoading = false;
      }
    },

    setScheduleTagsGroups(scheduleTags: ScheduleTags | Group[]) {
      let groups: Group[] = [];

      // If the response is already an array, assign it directly
      if (Array.isArray(scheduleTags)) {
        groups = scheduleTags;
      } else if (scheduleTags.Group) {
        // If the response contains a `Group` key, extract it
        groups = Array.isArray(scheduleTags.Group)
          ? scheduleTags.Group
          : [scheduleTags.Group];
      }

      // Sort groups alphabetically by BSKEY
      this.scheduleTagsGroups = groups.sort((a, b) =>
        a.BSKEY.localeCompare(b.BSKEY)
      );
    },
    setEditingSchedule(id: string | null) {
      this.editingScheduleId = id;
    },
  },
});
