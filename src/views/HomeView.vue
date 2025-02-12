<template>
  <main-page />
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import MainPage from "@/components/MainPage.vue";

export default defineComponent({
  name: "HomeView",

  components: {
    MainPage,
  },
});
</script>
