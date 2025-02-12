import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia"; // ✅ Correct way to use Pinia
import { createVuetify } from "vuetify"; // ✅ Import createVuetify
import "vuetify/styles"; // ✅ Import Vuetify styles
import { loadFonts } from "./plugins/webfontloader";
import "@mdi/font/css/materialdesignicons.css";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

loadFonts();

const app = createApp(App);
app.component("VueDatePicker", VueDatePicker);
const vuetify = createVuetify({
  theme: {
    defaultTheme: "dark",
  },
});

app.use(createPinia()); // ✅ Add Pinia here
app.use(router);
app.use(vuetify);

app.mount("#app");
