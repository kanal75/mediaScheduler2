<template>
  <v-container>
    <v-app-bar :elevation="2">
      <template v-slot:prepend>
        <v-app-bar-nav-icon></v-app-bar-nav-icon>
      </template>
      <v-btn icon to="/">
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <v-app-bar-title>Media Scheduler 2o</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="refStore.isLogInMenu = !refStore.isLogInMenu">
        <v-icon>mdi-account</v-icon>
      </v-btn>
      <v-btn icon @click="toggleTheme">
        <v-icon
          :icon="
            refStore.isDarkMode ? 'mdi-weather-night' : 'mdi-weather-sunny'
          "
        ></v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon to="/about">mdi-magnify</v-icon>
      </v-btn>
      <template v-slot:append>
        <v-btn icon="mdi-dots-vertical"></v-btn>
      </template>
    </v-app-bar>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useTheme } from "vuetify";
import { useRefStore } from "@/store/RefStore";

export default defineComponent({
  name: "ToolBar",
  setup() {
    const refStore = useRefStore();
    const theme = useTheme();

    const toggleTheme = () => {
      refStore.isDarkMode = !refStore.isDarkMode;
      theme.global.name.value = refStore.isDarkMode ? "dark" : "light";
    };

    return {
      refStore,
      toggleTheme,
    };
  },
});
</script>
