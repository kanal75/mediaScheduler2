/* eslint-disable */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  interface Window {
    $toast?: {
      add: (options: {
        severity: string;
        summary: string;
        detail: string;
        life?: number;
      }) => void;
    };
  }
}
