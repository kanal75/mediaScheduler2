<template>
  <v-app>
    <v-main>
      <ToolBar />
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ToolBar from "@/components/ToolBar.vue";

export default defineComponent({
  name: "App",
  components: {
    ToolBar,
  },
  data() {
    return {
      //
    };
  },
});
</script>
