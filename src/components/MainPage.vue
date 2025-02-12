<template>
  <calenderTest />
  <AGgrid />
  <LogInMenu />
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import AGgrid from "./AGgrid.vue";
import LogInMenu from "./LogInMenu.vue";
import { useRootStore } from "@/store/RootStore";
export default defineComponent({
  name: "HelloWorld",
  components: {
    AGgrid,
    LogInMenu,
  },
  setup() {
    const rootStore = useRootStore();
    onMounted(() => {
      rootStore.fetchSchedules();
      rootStore.fetchScheduleTagsGroups();
    });
    return {};
  },
});
</script>
