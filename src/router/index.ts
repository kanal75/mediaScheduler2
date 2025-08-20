import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "DashBoard",
    component: () => import("@/views/DashBoard.vue"),
  },
  // other routes...
];

const router = createRouter({
  history: createWebHistory("/mediascheduler2/"),
  routes,
});

// Global navigation guard to auto-login if query param "account" exists.
import { useAccountStore } from "@/store/AccountStore";
router.beforeEach((to, from, next) => {
  const accountStore = useAccountStore();
  if (to.query.account && !accountStore.account) {
    const accountId = to.query.account as string;
    accountStore.signIn(accountId);
  }
  next();
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("Navigating to:", to.name);
  }
});

export default router;
