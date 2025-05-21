<template>
  <Drawer
    v-model:visible="refStore.showAccountPanel"
    position="right"
    class="account-drawer"
    :style="{ width: '400px' }"
  >
    <!-- Top Section: dark gray with centered avatar -->
    <div class="top-section d-flex flex-column align-center justify-center">
      <div class="avatar-wrapper">
        <Avatar icon="pi pi-user" size="xlarge" shape="circle" />
      </div>
    </div>
    <!-- Middle Section: black background with form or user info -->
    <div
      class="middle-section d-flex flex-column align-center justify-center pa-4"
    >
      <div v-if="!account">
        <div class="text-h6 mb-3 white--text">Sign In</div>
        <InputText
          v-model="loginName"
          :placeholder="isRegister ? 'First Name' : 'Account Name'"
          class="mb-2 w-full"
        />
        <InputText
          v-if="isRegister"
          v-model="lastName"
          placeholder="Last Name"
          class="mb-2 w-full"
        />
        <Button
          :label="isRegister ? 'Create' : 'Sign In'"
          @click="handleAction"
          class="mb-2 w-full"
        />
        <Button
          :label="isRegister ? 'Sign In' : 'Sign Up'"
          @click="toggleRegisterMode"
          class="w-full p-button-text white--text"
        />
      </div>
      <div v-else>
        <div class="text-h6 mb-2 white--text">
          {{ account.firstName }} {{ account.lastName }}
        </div>
        <div class="mb-3 white--text">You are signed in.</div>
        <Button label="Logout" @click="logout" class="w-full" />
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRefStore } from "@/store/RefStore";
import { useAccountStore } from "@/store/AccountStore";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "AccountPanel",
  setup() {
    const refStore = useRefStore();
    const accountStore = useAccountStore();
    const router = useRouter();
    const account = computed(() => accountStore.account);
    const loginName = ref("");
    const lastName = ref("");
    const isRegister = ref(false);
    const handleAction = async () => {
      const trimmedName = loginName.value.trim();
      if (!trimmedName) return;
      if (isRegister.value) {
        await accountStore.register({
          firstName: trimmedName,
          lastName: lastName.value.trim(),
        });
      } else {
        await accountStore.signInByName(trimmedName);
      }
      if (accountStore.account) {
        router.push({ query: { account: accountStore.account.id } });
      }
      loginName.value = "";
      lastName.value = "";
    };
    const toggleRegisterMode = () => {
      isRegister.value = !isRegister.value;
    };
    const logout = () => {
      accountStore.logout();
      router.push({ query: {} });
    };
    return {
      refStore,
      account,
      loginName,
      lastName,
      isRegister,
      handleAction,
      toggleRegisterMode,
      logout,
    };
  },
});
</script>

<style scoped>
.account-drawer {
  z-index: 1300;
}
.top-section {
  background-color: #3d3d3d;
  height: 120px;
}
.avatar-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.middle-section {
  background-color: #1e1e1e;
  min-height: 150px;
}
.middle-section .white--text {
  color: #fff;
}
</style>
