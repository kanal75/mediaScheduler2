<template>
  <v-card class="pa-4" elevation="2" width="300" v-if="refStore.isLogInMenu">
    <!-- User Profile -->
    <v-list>
      <v-list-item>
        <v-avatar size="48">
          <v-icon>mdi-vuetify</v-icon>
        </v-avatar>
        <v-list-item-content>
          <v-list-item-title class="text-h6">Guest</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <!-- Menu Items -->
    <v-list>
      <v-list-item>
        <v-badge color="red" content="10">
          <v-icon left>mdi-bell</v-icon>
          Notifications
        </v-badge>
      </v-list-item>

      <v-list-item>
        <v-icon left>mdi-flask</v-icon>
        Vuetify Studio
        <v-chip small color="yellow darken-3">Closed Alpha</v-chip>
      </v-list-item>

      <v-list-item>
        <v-icon left>mdi-heart</v-icon>
        Sponsorships
      </v-list-item>

      <v-list-item>
        <v-icon left>mdi-cog</v-icon>
        Settings
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <!-- Sync Status -->
    <v-sheet class="pa-2 mt-2" color="grey darken-3">
      <v-icon left>mdi-sync-off</v-icon> Sync is paused
    </v-sheet>

    <v-divider></v-divider>

    <!-- Login Buttons -->
    <v-list class="mt-2">
      <v-btn block color="grey darken-2" class="mb-2">
        <v-icon left>mdi-github</v-icon> Login with GitHub
      </v-btn>

      <v-btn block color="blue" class="mb-2">
        <v-icon left>mdi-discord</v-icon> Login with Discord
      </v-btn>

      <v-btn block color="green darken-1">
        <v-icon left>mdi-store</v-icon> Login with Shopify
      </v-btn>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRefStore } from "@/store/RefStore";

export default defineComponent({
  setup() {
    const refStore = useRefStore(); // Initialize store usage

    return {
      refStore,
    };
  },
});
</script>
