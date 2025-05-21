// src/store/GridStateStore.ts
import { defineStore } from "pinia";

export const useGridStateStore = defineStore("GridStateStore", {
  state: () => ({
    currentState: {} as any,
  }),
  actions: {
    updateState(newState: any) {
      this.currentState = newState;
    },
  },
});
