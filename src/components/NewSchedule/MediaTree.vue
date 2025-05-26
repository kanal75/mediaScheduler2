<template>
  <div>
    <!-- Loading Indicator -->
    <div v-if="isTreeLoading" class="p-4 text-center">Loading tree data...</div>

    <!-- Scrollable Container for the Tree Component -->
    <!-- This container allows both vertical and horizontal scrolling -->
    <div
      v-else
      class="card"
      style="overflow-x: auto; overflow-y: auto; max-height: 80vh"
    >
      <!-- Wrap Tree in a container with a minimum width -->
      <div style="min-width: 30rem">
        <Toast />
        <Tree
          v-model:selectionKeys="selectedKey"
          :value="nodes"
          selectionMode="single"
          :expandedKeys="expandedKeys"
          class="w-full"
          @node-expand="handleNodeExpand"
          style="margin-left: auto; margin-right: 10px"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { useRootStore } from "@/store/RootStore";
import type { TreeNode } from "primevue/treenode";

export default defineComponent({
  name: "MediaTree",
  setup() {
    const rootStore = useRootStore();
    const isTreeLoading = ref(true);
    const selectedKey = ref<Record<string, boolean> | undefined>(undefined);

    onMounted(async () => {
      if (!rootStore.treeData) {
        await rootStore.fetchTreeData();
      }
      isTreeLoading.value = false;
    });

    // Recursively transforms a folder object into a tree node and builds unique keys by combining parent's key.
    function transformFolder(folder: any, parentKey = ""): TreeNode {
      const baseKey =
        folder.BSKEY || folder.Path || folder.Name || "unknown-folder";
      const key = parentKey ? `${parentKey}_${baseKey}` : baseKey;
      const label = folder.Name || baseKey;
      let children: TreeNode[] = [];
      if (folder.Folder) {
        children = Array.isArray(folder.Folder)
          ? folder.Folder.map((child: Record<string, unknown>) =>
              transformFolder(child, key)
            )
          : [transformFolder(folder.Folder, key)];
      }
      let fileNodes: TreeNode[] = [];
      if (folder.File) {
        const filesArr = Array.isArray(folder.File)
          ? folder.File
          : [folder.File];
        fileNodes = filesArr.map((f: any) => {
          const fBaseKey = f.BSKEY || f.Path || f.Name || "unknown-file";
          const fileKey = `${key}_${fBaseKey}`;
          return {
            key: fileKey,
            label: f.Data?.General?.Name || f.BSKEY || f.Name || "File",
            leaf: true,
            data: { rawFile: f },
          };
        });
      }
      return {
        key,
        label,
        children: [...children, ...fileNodes],
        data: { rawFolder: folder },
      };
    }

    function transformTreeData(raw: unknown): TreeNode[] {
      if (!raw) return [];
      const arrData = Array.isArray(raw) ? raw : [raw];
      return arrData.map((item: Record<string, unknown>) => {
        const baseKey =
          item.BSKEY || item.ID || item.Name || "unknown-top-level";
        const key = baseKey as string;
        const itemLabel = item.Name || baseKey;
        let children: TreeNode[] = [];
        if (item.Folder) {
          children = Array.isArray(item.Folder)
            ? item.Folder.map((child: Record<string, unknown>) =>
                transformFolder(child, key)
              )
            : [transformFolder(item.Folder, key)];
        }
        return {
          key,
          label: itemLabel as string,
          children,
        };
      });
    }

    const nodes = computed(() => transformTreeData(rootStore.treeData));

    // Helper: Find path to a node by label.
    function findPathByLabel(
      nodesArray: TreeNode[],
      labelToFind: string,
      path: string[] = []
    ): string[] | null {
      for (const node of nodesArray) {
        const newPath = [...path, node.key as string];
        if (node.label === labelToFind) return newPath;
        if (node.children && node.children.length) {
          const res: string[] | null = findPathByLabel(
            node.children,
            labelToFind,
            newPath
          );
          if (res) return res;
        }
      }
      return null;
    }

    // Helper: Find path under a specified parent.
    function findPathUnderParent(
      nodesArray: TreeNode[],
      parentLabel: string,
      targetLabel: string,
      path: string[] = []
    ): string[] | null {
      for (const node of nodesArray) {
        const newPath = [...path, node.key as string];
        if (node.label === parentLabel) {
          const childPath = findPathByLabel(node.children ?? [], targetLabel);
          if (childPath) return [...newPath, ...childPath];
        }
        if (node.children && node.children.length) {
          const result: string[] | null = findPathUnderParent(
            node.children,
            parentLabel,
            targetLabel,
            newPath
          );
          if (result) return result;
        }
      }
      return null;
    }

    const autoSelectScheduleTypes = ["Slinga", "Banner", "Clip", "Music"];
    const expandedKeys = computed(() => {
      const keys: Record<string, boolean> = {};
      const profile = rootStore.newSchedule.profile;
      const scheduleType = rootStore.newSchedule.scheduleTypes;
      if (autoSelectScheduleTypes.includes(scheduleType)) {
        let path = null;
        if (profile === "ATGLIVE") {
          path = findPathUnderParent(nodes.value, "ATGLIVE", scheduleType);
        } else if (profile === "ASR") {
          path = findPathUnderParent(nodes.value, "ASR", scheduleType);
        } else if (profile === "DANISH") {
          path = findPathUnderParent(nodes.value, "DANISH", scheduleType);
        } else if (profile === "NORDIC") {
          path = findPathUnderParent(nodes.value, "NORDIC", scheduleType);
        }
        if (path) {
          path.forEach((k: string) => {
            keys[k] = true;
          });
        } else {
          console.log(
            `No matching path found for profile ${profile} and target '${scheduleType}'.`
          );
        }
      }
      return keys;
    });

    // Helper: Find a node by its key.
    function findNodeByKey(
      nodesArray: TreeNode[],
      key: string
    ): TreeNode | null {
      for (const node of nodesArray) {
        if (node.key === key) return node;
        if (node.children && node.children.length) {
          const found: TreeNode | null = findNodeByKey(node.children, key);
          if (found) return found;
        }
      }
      return null;
    }

    // --- Updated Watcher: Set Selected File or Folder ---
    watch(selectedKey, (newVal) => {
      let key: string | null = null;
      if (newVal && typeof newVal === "object" && !Array.isArray(newVal)) {
        const keys = Object.keys(newVal);
        if (keys.length > 0) key = keys[0];
      } else if (Array.isArray(newVal)) {
        key = newVal.length > 0 ? (newVal[0] as string) : null;
      } else {
        key = newVal !== undefined ? (newVal as string) : null;
      }
      if (key) {
        const node = findNodeByKey(nodes.value, key);
        if (node) {
          if (node.leaf && node.data?.rawFile) {
            rootStore.setSelectedFile(node.data.rawFile);
            // Also set the folder to the parent folder if available
            if (node.key && node.key.includes("_")) {
              const parentKey = node.key.substring(
                0,
                node.key.lastIndexOf("_")
              );
              const parentNode = findNodeByKey(nodes.value, parentKey);
              if (parentNode) {
                rootStore.setSelectedFolder(parentNode.data?.rawFolder ?? null);
              } else {
                rootStore.setSelectedFolder(null);
              }
            } else {
              rootStore.setSelectedFolder(null);
            }
          } else {
            // Set the selected folder to the node's rawFolder
            rootStore.setSelectedFolder(node.data?.rawFolder ?? null);
            rootStore.setSelectedFile(null);
          }
        } else {
          console.log("Node not found for key:", key);
          rootStore.setSelectedFile(null);
          rootStore.setSelectedFolder(null);
        }
      } else {
        rootStore.setSelectedFile(null);
        rootStore.setSelectedFolder(null);
      }
    });

    // --- Auto-Select Watcher for Profile & Schedule Type ---
    watch(
      [
        nodes,
        () => rootStore.newSchedule.profile,
        () => rootStore.newSchedule.scheduleTypes,
      ],
      ([newNodes, profile, scheduleType]) => {
        if (scheduleType === "system") return;
        selectedKey.value = {};
        rootStore.setSelectedFile(null);
        rootStore.setSelectedFolder({} as import("@/types").TreeNode);
        const autoSelectScheduleTypes = computed(() => rootStore.scheduleTypes);
        if (
          newNodes &&
          newNodes.length > 0 &&
          autoSelectScheduleTypes.value.includes(scheduleType)
        ) {
          let path = null;
          if (profile === "ATGLIVE") {
            path = findPathUnderParent(newNodes, "ATGLIVE", scheduleType);
          } else if (profile === "ASR") {
            path = findPathUnderParent(newNodes, "ASR", scheduleType);
          } else if (profile === "DANISH") {
            path = findPathUnderParent(newNodes, "DANISH", scheduleType);
          } else if (profile === "NORDIC") {
            path = findPathUnderParent(newNodes, "NORDIC", scheduleType);
          }
          if (path) {
            const targetKey = path[path.length - 1];
            selectedKey.value = { [targetKey]: true };
          }
        }
      },
      { immediate: true }
    );

    async function handleNodeExpand(event: unknown) {
      const expNode = (event as { node?: TreeNode })?.node
        ? (event as { node: TreeNode }).node
        : event;
      if (!expNode) {
        console.error("No expanded node found in event:", event);
        return;
      }
    }

    return {
      isTreeLoading,
      selectedKey,
      nodes,
      expandedKeys,
      handleNodeExpand,
    };
  },
});
</script>
