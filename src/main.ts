import { createApp } from "vue";
import PrimeVue from "primevue/config";
// Import PrimeVue core and theme CSS files
import "primeflex/primeflex.css"; // optional, if you want PrimeFlex for layout
import ToastService from "primevue/toastservice";
import Aura from "@primevue/themes/aura";
import { definePreset } from "@primevue/themes";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia"; // ✅ Pinia for state management
import { useRefStore } from "@/store/RefStore";
import "./styles.css";

import Tooltip from "primevue/tooltip";
// AG Grid styles (core and Quartz theme)
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
// PrimeIcons (needed for pi-* icon classes)
import "primeicons/primeicons.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
const refStore = useRefStore(pinia);
document.documentElement.classList.toggle("app-dark", refStore.isDarkMode);
const Noir = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{zinc.50}",
      100: "{zinc.100}",
      200: "{zinc.200}",
      300: "{zinc.300}",
      400: "{zinc.400}",
      500: "{zinc.500}",
      600: "{zinc.600}",
      700: "{zinc.700}",
      800: "{zinc.800}",
      900: "{zinc.900}",
      950: "{zinc.950}",
    },
    colorScheme: {
      light: {
        primary: {
          color: "{zinc.950}",
          inverseColor: "#ffffff",
          hoverColor: "{zinc.900}",
          activeColor: "{zinc.800}",
        },
        highlight: {
          background: "{zinc.950}",
          focusBackground: "{zinc.700}",
          color: "#ffffff",
          focusColor: "#ffffff",
        },
      },
      dark: {
        primary: {
          color: "{zinc.50}",
          inverseColor: "{zinc.950}",
          hoverColor: "{zinc.100}",
          activeColor: "{zinc.200}",
        },
        highlight: {
          background: "rgba(250, 250, 250, .16)",
          focusBackground: "rgba(250, 250, 250, .24)",
          color: "rgba(255,255,255,.87)",
          focusColor: "rgba(255,255,255,.87)",
        },
      },
    },
  },
});

// 🔹 Register only the minimal components needed for the initial screen
import Button from "primevue/button";
import Avatar from "primevue/avatar";
app.component("Button", Button);
app.component("Avatar", Avatar);

// 🔹 Use Plugins
app.use(router); // ✅ Vue Router
app.use(PrimeVue, {
  theme: {
    preset: Noir,
    options: {
      // this is the class PrimeVue will look for to switch to dark tokens
      darkModeSelector: ".app-dark",
    },
  },
});
// ✅ PrimeVue services (keep only Toast for first screen)
app.use(ToastService);
app.directive("tooltip", Tooltip);
app.mount("#app");
