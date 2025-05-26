import { createApp } from "vue";
import PrimeVue from "primevue/config";
// Import PrimeVue core and theme CSS files
import "primeicons/primeicons.css";
import "primeflex/primeflex.css"; // optional, if you want PrimeFlex for layout
import ConfirmationService from "primevue/confirmationservice";
import DialogService from "primevue/dialogservice";
import ToastService from "primevue/toastservice";
import Aura from "@primevue/themes/aura";
import { definePreset } from "@primevue/themes";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia"; // ✅ Pinia for state management
import { useRefStore } from "@/store/RefStore";
import { createVuetify } from "vuetify"; // ✅ Vuetify UI framework
import "vuetify/styles"; // ✅ Vuetify styles
import { loadFonts } from "./plugins/webfontloader";
import "@mdi/font/css/materialdesignicons.css";
import "./styles.css";

// 🔹 Import Vue Date Picker (Optional)
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
loadFonts();

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

// 🔹 Register Components Globally
app.component("VueDatePicker", VueDatePicker);

// 🔹 Register PrimeVue Components
import Button from "primevue/button";
import Tag from "primevue/tag";
import Chip from "primevue/chip";
import Dialog from "primevue/dialog";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import SelectButton from "primevue/selectbutton";
import DatePicker from "primevue/datepicker";
import CascadeSelect from "primevue/cascadeselect";
import MultiSelect from "primevue/multiselect";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import Form from "@primevue/forms/form";
import Panel from "primevue/panel";
import Card from "primevue/card";
import Message from "primevue/message";
import Toast from "primevue/toast";
import Tree from "primevue/tree";
import Galleria from "primevue/galleria";
import ToggleSwitch from "primevue/toggleswitch";
import Calendar from "primevue/calendar";
import Divider from "primevue/divider";
import ImageCompare from "primevue/imagecompare";
import Drawer from "primevue/drawer";
import InputSwitch from "primevue/inputswitch";
import Avatar from "primevue/avatar";
import Select from "primevue/select";
import InputGroup from "primevue/inputgroup";
import InputNumber from "primevue/inputnumber";
import InputGroupAddon from "primevue/inputgroupaddon";
import ProgressSpinner from "primevue/progressspinner";

app.component("Button", Button);
app.component("Tag", Tag);
app.component("Chip", Chip);
app.component("Dialog", Dialog);
app.component("Checkbox", Checkbox);
app.component("InputText", InputText);
app.component("Textarea", Textarea);
app.component("SelectButton", SelectButton);
app.component("DatePicker", DatePicker);
app.component("CascadeSelect", CascadeSelect);
app.component("MultiSelect", MultiSelect);
app.component("Splitter", Splitter);
app.component("SplitterPanel", SplitterPanel);
app.component("Form", Form);
app.component("Panel", Panel);
app.component("Card", Card);
app.component("Message", Message);
app.component("Toast", Toast);
app.component("Tree", Tree);
app.component("Galleria", Galleria);
app.component("Switch", ToggleSwitch);
app.component("Calendar", Calendar);
app.component("Divider", Divider);
app.component("ImageCompare", ImageCompare);
app.component("Drawer", Drawer);
app.component("InputSwitch", InputSwitch);
app.component("Avatar", Avatar);
app.component("Select", Select);
app.component("InputGroup", InputGroup);
app.component("InputNumber", InputNumber);
app.component("InputGroupAddon", InputGroupAddon);
app.component("ProgressSpinner", ProgressSpinner);

const vuetify = createVuetify({
  theme: {
    defaultTheme: "dark",
  },
});

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
// ✅ PrimeVue
app.use(ConfirmationService); // ✅ PrimeVue Confirmation Service
app.use(DialogService); // ✅ PrimeVue Dialog Service
app.use(ToastService); // ✅ PrimeVue Toast Service
app.use(vuetify); // ✅ Vuetify
app.mount("#app");
