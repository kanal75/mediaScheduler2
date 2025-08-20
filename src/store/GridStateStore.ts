// src/store/GridStateStore.ts
import { defineStore } from "pinia";

export const useGridStateStore = defineStore("GridStateStore", {
  state: () => ({
    currentState: {} as unknown,
  }),
  actions: {
    updateState(newState: unknown) {
      this.currentState = newState;
    },
  },
});
