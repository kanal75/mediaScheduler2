import { defineStore } from "pinia";
import axios from "axios";
import { ref, Ref } from "vue";
import { useToast } from "primevue/usetoast";
import { useRootStore } from "./RootStore";
import type { SystemFormModel, Leg, TrackBetType, HorseStart } from "../types";

export const useSystemStore = defineStore("system", () => {
  // State
  const system: Ref<SystemFormModel> = ref({
    title: "",
    date: "",
    track: "",
    betType: "",
    legs: [],
    path: "",
    location: "",
  });
  const dayTracks: Ref<string[]> = ref([]);
  const trackBetTypes: Ref<TrackBetType[]> = ref([]);
  const systemModalVisible = ref(false);
  const png = ref(null);
  const toast = useToast();
  const rootStore = useRootStore();
  // Define your API base URL based on the environment (same as RootStore)
  const isProd = process.env.NODE_ENV === "production";
  const baseURL = isProd
    ? window.location.origin + "/ROOT/"
    : "http://127.0.0.1/ROOT/";

  // Actions
  async function getDayTracks() {
    const tempArray: string[] = [];
    const getString =
      "AISDATA/DAY[DATE='" +
      system.value.date +
      "']/TRACK/RaceDayInfos/RaceDayInfo/track?type=copy";
    try {
      const res = await axios.get(baseURL + getString);
      if (Array.isArray(res.data)) {
        for (let i = 0; i < res.data.length; i++) {
          tempArray.push(res.data[i].domesticText);
        }
      } else if (typeof res.data.track === "string") {
        tempArray.push(res.data.track);
      } else if (typeof res.data === "string") {
        tempArray.push(res.data);
      }
      dayTracks.value = tempArray;
      system.value.track = dayTracks.value[0] || "";
      await getTrackBetTypes();
    } catch (error) {
      console.log(error);
      system.value.date = "";
      system.value.track = "";
      system.value.betType = "";
      system.value.legs = [];
      dayTracks.value = [];
      trackBetTypes.value = [];
    }
  }

  async function getTrackBetTypes() {
    const tempArray: TrackBetType[] = [];
    const getString =
      "AISDATA/DAY[DATE='" +
      system.value.date +
      "']/TRACK[RaceDayInfos/RaceDayInfo/track/domesticText='" +
      system.value.track +
      "']/BetFormsSorteds/BetFormsSorted/betForm[group!='ENLOPP']?type=copy";
    try {
      const res = await axios.get(baseURL + getString);
      if (res.data.length) {
        for (let i = 0; i < res.data.length; i++) {
          tempArray.push(res.data[i]);
        }
      } else {
        tempArray.push(res.data);
      }
      trackBetTypes.value = tempArray;
      let tilte;
      if (rootStore.newSchedule && rootStore.newSchedule.profile === "ASR") {
        tilte = (system.value.track || "").toUpperCase() + " SUGGESTION";
      } else if (
        rootStore.newSchedule &&
        rootStore.newSchedule.profile === "ATGLIVE"
      ) {
        tilte = (system.value.track || "").toUpperCase() + " SYSTEMFÖRSLAG";
      }
      system.value.title = tilte || "";
      system.value.betType = trackBetTypes.value[0]?.id || "";
      await getBetForms();
    } catch (error) {
      console.log(error);
      system.value.betType = "";
      system.value.legs = [];
      trackBetTypes.value = [];
    }
  }

  async function getBetForms() {
    system.value.legs = [];
    let BetFormsRaceSortedURL = "";
    const i = trackBetTypes.value.findIndex(
      (item: TrackBetType) => item.id === system.value.betType
    );
    if (trackBetTypes.value[i]?.multiplepooltrackid) {
      BetFormsRaceSortedURL =
        "AISDATA/DAY[DATE='" +
        system.value.date +
        "']/TRACK/BetFormsRaceSorteds/BetFormsRaceSorted[BetForms/betForm/id='" +
        system.value.betType +
        "'and BetForms/betForm[1]/multiplepooltrackid='" +
        trackBetTypes.value[i].multiplepooltrackid +
        "']?type=copy";
    } else {
      BetFormsRaceSortedURL =
        "AISDATA/DAY[DATE='" +
        system.value.date +
        "']/TRACK[RaceDayInfos/RaceDayInfo/track/domesticText='" +
        system.value.track +
        "']/BetFormsRaceSorteds/BetFormsRaceSorted[BetForms/betForm/id='" +
        system.value.betType +
        "']?type=copy";
    }
    try {
      const res = await axios.get(baseURL + BetFormsRaceSortedURL);
      for (let j = 0; j < res.data.length; j++) {
        const index = res.data[j].BetForms.betForm.findIndex(
          (item: TrackBetType) => item.id === system.value.betType
        );
        system.value.legs.push({
          fullName: res.data[j].BetForms.betForm[index].fullName,
          legNr: res.data[j].BetForms.betForm[index].legNr,
          trackId: res.data[j].trackKey.trackId,
          raceNr: res.data[j].raceNr,
          checked: [],
          starts: [],
          textInput: "",
          isAllChecked: false,
          indeterminate: false,
          timePicker: [], // <-- add this line
        });
      }
      system.value.legs.sort(function (a: Leg, b: Leg) {
        return a.legNr - b.legNr;
      });
      await getHorses();
    } catch (error) {
      console.log(error);
      system.value.legs = [];
    }
  }

  async function getHorses() {
    for (let i = 0; i < system.value.legs.length; i++) {
      const getString =
        "/AISDATA/DAY[DATE='" +
        system.value.date +
        "']/TRACK[TRACKID='" +
        system.value.legs[i].trackId +
        "']/RacingCards/RacingCard[races/Race/raceNr='" +
        system.value.legs[i].raceNr +
        "']/races/Race/starts/Start/horse/horseNameAndNationality|" +
        "/ROOT/AISDATA/DAY[DATE='" +
        system.value.date +
        "']/TRACK[TRACKID='" +
        system.value.legs[i].trackId +
        "']/VPPoolInfos/VPPoolInfo[raceNr='" +
        system.value.legs[i].raceNr +
        "']/vpOdds/VPOdds/scratched|" +
        "/ROOT/AISDATA/DAY[DATE='" +
        system.value.date +
        "']/TRACK[TRACKID='" +
        system.value.legs[i].trackId +
        "']/RacingCards/RacingCard[races/Race/raceNr='" +
        system.value.legs[i].raceNr +
        "']/races/Race/starts/Start/startNr?type=copy";
      try {
        const res = await axios.get(baseURL + getString);
        const starts = [];
        const data = res.data;
        const numHorses = data.length / 3;
        for (let j = 0; j < numHorses; j++) {
          const horseIndex = j * 2;
          const scratchIndex = numHorses * 2 + j;
          const startNr = data[horseIndex + 1];
          const horseNameAndNationality = data[horseIndex];
          const scratched = JSON.parse(data[scratchIndex]);
          starts.push({
            hnr: startNr,
            hName: horseNameAndNationality,
            scratched: scratched,
          });
        }
        system.value.legs[i].starts = starts;
      } catch (error) {
        console.log(error);
        system.value.legs = [];
      }
    }
  }

  function options(
    starts: HorseStart[]
  ): { label: string; value: string; disabled: boolean; hName: string }[] {
    return starts.map((start) => ({
      label: start.hnr,
      value: start.hnr,
      disabled: start.scratched,
      hName: start.hName,
    }));
  }

  function checkAll(leg: Leg) {
    if (leg.isAllChecked) {
      leg.checked = leg.starts
        .filter((item) => !item.scratched)
        .map((item) => item.hnr);
      leg.indeterminate = false;
    } else {
      leg.checked = [];
      leg.indeterminate = false;
    }
  }

  function checkAllChecked(leg: Leg) {
    const enabledOptions = options(
      leg.starts.filter((item) => !item.scratched)
    );
    if (leg.checked.length === enabledOptions.length) {
      leg.isAllChecked = true;
      leg.indeterminate = false;
    } else if (leg.checked.length > 0) {
      leg.isAllChecked = false;
      leg.indeterminate = true;
    } else {
      leg.isAllChecked = false;
      leg.indeterminate = false;
    }
  }

  async function createPNG(pngData: any) {
    const headers = { "Content-Type": "application/json;charset=utf-8" };
    try {
      console.log("Creating PNG with data:", pngData);
      const res = await axios.post(
        "http://10.200.35.111:3001/create-image/",
        JSON.stringify(pngData),
        { headers: headers, responseType: "blob" }
      );
      if (res.status === 200) {
        png.value = res.data;
        toast.add({
          severity: "success",
          summary: "Success",
          detail: "System is successfully created!",
        });
      } else {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "Something went wrong!",
        });
      }
    } catch (error) {
      console.log(error);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Something went wrong!",
      });
    }
  }

  // Centralized default system state
  function getDefaultSystem(): SystemFormModel {
    return {
      title: "",
      date: "",
      track: "",
      betType: "",
      legs: [],
      path: "",
      location: "",
    };
  }

  function resetForm() {
    const defaults = getDefaultSystem();
    // Reset each property individually to preserve reactivity
    Object.keys(defaults).forEach((key) => {
      (system.value as any)[key] = (defaults as any)[key];
    });
    // Reset all legs and their fields if any legs exist
    if (Array.isArray(system.value.legs)) {
      system.value.legs.forEach((leg) => {
        leg.checked = [];
        leg.isAllChecked = false;
        leg.indeterminate = false;
        leg.textInput = "";
        leg.timePicker = [];
      });
    }
    dayTracks.value = [];
    trackBetTypes.value = [];
  }

  return {
    system,
    dayTracks,
    trackBetTypes,
    systemModalVisible,
    png,
    getDayTracks,
    getTrackBetTypes,
    getBetForms,
    getHorses,
    createPNG,
    resetForm,
    options,
    checkAll,
    checkAllChecked,
  };
});
