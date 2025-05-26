import { defineStore } from "pinia";
import axios from "axios";
import moment from "moment";
import { useNotificationStore } from "./NotificationStore";
import type {
  Group,
  Tag,
  ScheduleTags,
  NewSchedule,
  TreeNode,
  Item,
  Schedule,
} from "@/types";

// Define your API base URL based on the environment.
const isProd = process.env.NODE_ENV === "production";
const baseURL = isProd
  ? window.location.origin + "/ROOT/"
  : "http://127.0.0.1/ROOT/";

// Recursively transforms a folder object into a TreeNode.
function transformFolder(folder: any): TreeNode {
  const node: TreeNode = {
    name: folder.Name,
    path: folder.Path,
    bskey: folder.BSKEY,
    children: [],
    files: [],
  };

  if (folder.Folder) {
    if (Array.isArray(folder.Folder)) {
      node.children = folder.Folder.map(transformFolder);
    } else {
      node.children.push(transformFolder(folder.Folder));
    }
  }

  if (folder.File) {
    if (Array.isArray(folder.File)) {
      node.files = folder.File;
    } else {
      node.files.push(folder.File);
    }
  }

  return node;
}

// ----------------------------
// RootStore Definition
// ----------------------------
export const useRootStore = defineStore("RootStore", {
  state: (): {
    schedules: Item[];
    isScheduleLoading: boolean;
    scheduleTagsGroups: Group[];
    scheduleTags: Tag[];
    isTagsLoading: boolean;
    editingScheduleId: string | null;
    newSchedule: NewSchedule;
    treeData: TreeNode | null;
    selectedFolder: any | null;
    selectedFile: any | null;
    profiles: string[];
    scheduleTypes: string[];
  } => ({
    schedules: [],
    isScheduleLoading: true,
    scheduleTagsGroups: [],
    scheduleTags: [],
    isTagsLoading: false,
    editingScheduleId: null,
    newSchedule: {
      id: "",
      profile: "",
      scheduleTypes: "",
      scheduleTags: [],
      timePicker: [],
      priority: 0,
      status: "",
      specificTime: false,
      specificTimes: [],
      metaData: {
        title: "",
        date: "",
        track: "",
        betType: "",
        legs: [],
        path: "",
        location: "",
      },
    },
    treeData: null,
    selectedFolder: null,
    selectedFile: null,
    profiles: [],
    scheduleTypes: [],
  }),

  actions: {
    // Fetch profiles for the Profile select
    async fetchProfiles() {
      try {
        // note: no "/Id" in the path
        const resp = await axios.get<any[]>(
          `${baseURL}MEDIASCHEDULER/Profiles?type=copy`
        );
        // assume each item has an "Id" property at the top level
        this.profiles = Array.isArray(resp.data)
          ? resp.data.map((item) => item.Id)
          : [];
      } catch (err) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Profiles",
          detail: "Error fetching Profiles.",
          life: 3000,
        });
        console.error("Error fetching Profiles:", err);
      }
    },
    async fetchScheduleTypes() {
      try {
        // note: no "/Id" in the path
        const resp = await axios.get<any[]>(
          `${baseURL}MEDIASCHEDULER/ScheduleTypes?type=copy`
        );
        // assume each item has an "Id" property at the top level
        this.scheduleTypes = Array.isArray(resp.data)
          ? resp.data.map((item) => item.Id)
          : [];
      } catch (err) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Schedule Types",
          detail: "Error fetching Schedule Types.",
          life: 3000,
        });
        console.error("Error fetching ScheduleTypes:", err);
      }
    },

    // Fetch schedules and sort them by addTimestamp.
    async fetchSchedules() {
      this.isScheduleLoading = true;
      try {
        const response = await axios.get<Schedule[]>(
          `${baseURL}MEDIASCHEDULER/Schedules?type=copy`
        );
        this.setSchedules(response.data);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Schedules",
          detail: "Error fetching schedules.",
          life: 3000,
        });
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

      tempArray.forEach((schedule) => {
        if (!schedule.scheduleTags) {
          schedule.scheduleTags = [];
        }
        // If status is 'Paused', do not change it
        if (schedule.status === "Paused") {
          return;
        }
        // Compute status from timePicker
        const timePicker = schedule.timePicker;
        let status = "Unscheduled";
        if (Array.isArray(timePicker) && timePicker.length === 2) {
          const [startStr, endStr] = timePicker;
          const start = moment(startStr, "YYYY-MM-DD HH:mm");
          const end = moment(endStr, "YYYY-MM-DD HH:mm");
          if (start.isValid() && end.isValid()) {
            const now = moment();
            if (now.isAfter(end)) {
              status = "Passed";
            } else if (now.isBefore(start)) {
              status = "Scheduled";
            } else if (
              (now.isAfter(start) && now.isBefore(end)) ||
              now.isSame(start) ||
              now.isSame(end)
            ) {
              status = "Active";
            }
          }
        }
        schedule.status = status;
      });

      this.schedules = tempArray.sort(
        (a, b) =>
          moment(b.bonsaiXmlDB.addTimestamp).valueOf() -
          moment(a.bonsaiXmlDB.addTimestamp).valueOf()
      );
    },

    // Fetch schedule tag groups and flatten tags.
    async fetchScheduleTagsGroups() {
      this.isTagsLoading = true;
      try {
        const response = await axios.get<ScheduleTags>(
          `${baseURL}MEDIASCHEDULER/ScheduleTags?type=copy`
        );
        this.setScheduleTagsGroups(response.data);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Schedule Tags",
          detail: "Error fetching schedule tags groups.",
          life: 3000,
        });
        console.error("Error fetching schedule tags groups:", error);
      } finally {
        this.isTagsLoading = false;
      }
    },

    setScheduleTagsGroups(scheduleTags: ScheduleTags | Group[]) {
      let groups: Group[] = [];

      if (Array.isArray(scheduleTags)) {
        groups = scheduleTags;
      } else if (scheduleTags.Group) {
        groups = Array.isArray(scheduleTags.Group)
          ? scheduleTags.Group
          : [scheduleTags.Group];
      }

      this.scheduleTagsGroups = groups.sort((a, b) =>
        a.BSKEY.localeCompare(b.BSKEY)
      );

      this.scheduleTags = groups.reduce((acc: Tag[], group: Group) => {
        if (group.Tag) {
          if (Array.isArray(group.Tag)) {
            return acc.concat(group.Tag);
          } else {
            return acc.concat([group.Tag]);
          }
        }
        return acc;
      }, []);
    },

    setEditingSchedule(id: string | null) {
      this.editingScheduleId = id;
    },

    updateScheduleTags(scheduleId: string, newTags: string[]) {
      const schedule = this.schedules.find((s: any) => s.id === scheduleId);
      if (schedule) {
        schedule.scheduleTags = newTags;
      }
    },

    // Fetch and transform the tree data.
    async fetchTreeData() {
      if (this.treeData) {
        // Already loaded, do not fetch again
        return;
      }
      try {
        const response = await axios.get(`${baseURL}SCAN_FILES/SCAN?type=copy`);
        let rawData = response.data;

        if (
          Array.isArray(rawData) &&
          rawData.length > 0 &&
          rawData[0]?._custom?.value
        ) {
          rawData = rawData[0]._custom.value;
        }
        this.treeData = rawData;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Tree Data",
          detail: "Error fetching tree data.",
          life: 3000,
        });
        console.error("Error fetching tree data:", error);
      }
    },

    // New action to set the currently selected folder.
    setSelectedFolder(folder: unknown) {
      this.selectedFolder = folder;
    },

    // New action to set the currently selected file.
    setSelectedFile(file: unknown) {
      this.selectedFile = file;
    },

    async putNewSchedule(newSchedule: NewSchedule) {
      try {
        const response = await axios.put(
          `${baseURL}MEDIASCHEDULER/Schedules/Schedule[Id='${newSchedule.profile}']/Items/Item[id='${newSchedule.id}']`,
          newSchedule
        );
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "success",
          summary: "Schedule",
          detail: "Schedule saved successfully.",
          life: 3000,
        });
        await this.fetchSchedules();
        return response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Schedule",
          detail: "Error saving schedule.",
          life: 3000,
        });
        console.error("Error saving NewSchedule:", error);
        throw error;
      }
    },

    // Add or update a schedule
    async upsertSchedule(schedule: Item) {
      try {
        const response = await axios.put(
          `${baseURL}MEDIASCHEDULER/Schedules/Schedule[Id='${schedule.profile}']/Items/Item[id='${schedule.id}']`,
          schedule
        );
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "success",
          summary: "Schedule",
          detail: "Schedule saved successfully.",
          life: 3000,
        });
        await this.fetchSchedules();
        return response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Schedule",
          detail: "Error saving schedule.",
          life: 3000,
        });
        throw error;
      }
    },

    // Delete a schedule
    async deleteSchedule(schedule: Item) {
      const url = `${baseURL}MEDIASCHEDULER/Schedules/Schedule[Id='${schedule.profile}']/Items/Item[id='${schedule.id}']`;
      try {
        await axios.delete(url);
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "success",
          summary: "Schedule",
          detail: "Schedule deleted successfully.",
          life: 3000,
        });
        await this.fetchSchedules();
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showToast({
          severity: "error",
          summary: "Schedule",
          detail: "Error deleting schedule.",
          life: 3000,
        });
        console.error("DELETE ERROR:", error);
        throw error;
      }
    },
    resetMedia() {
      this.selectedFile = null;
      this.selectedFolder = null;
      this.editingScheduleId = null;
    },

    resetNewSchedule() {
      // Reset each property individually for reactivity
      Object.assign(this.newSchedule, {
        id: "",
        profile: "",
        scheduleTypes: "",
        scheduleTags: [],
        timePicker: [],
        priority: 0,
        status: "",
        specificTime: false,
        specificTimes: [],
        metaData: {
          title: "",
          date: "",
          track: "",
          betType: "",
          legs: [],
          path: "",
          location: "",
        },
      });
      this.resetMedia();
    },
  },
});
