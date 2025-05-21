import { ref, computed, watch } from "vue";

export function useDateRangePicker(options: {
  initialRange?: string[] | Date[] | null;
  onChange?: (range: string[]) => void;
  dateFormat?: string;
}) {
  const dp = ref<unknown | null>(null);
  const attempted = ref(false);
  const showPrompt = ref(false);
  const promptWord = ref("");
  const localRange = ref<Date[] | null>(null);

  // Restore any previously‑saved range
  if (
    Array.isArray(options.initialRange) &&
    options.initialRange.length === 2
  ) {
    localRange.value = (options.initialRange as (string | Date)[]).map((s) =>
      s instanceof Date ? s : new Date(String(s).replace(" ", "T"))
    );
  }

  const isComplete = computed(
    () =>
      Array.isArray(localRange.value) &&
      localRange.value.length === 2 &&
      localRange.value[0] instanceof Date &&
      localRange.value[1] instanceof Date
  );

  function dateKey(d?: Date): string {
    return d ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` : "";
  }

  watch(
    () => localRange.value?.length,
    (newLen = 0, oldLen = 0) => {
      if (oldLen < 1 && newLen === 1) {
        promptWord.value = "start time";
        showPrompt.value = true;
      }
    }
  );

  const startTimeVal = computed(() =>
    localRange.value?.[0] instanceof Date ? localRange.value[0].getTime() : null
  );
  watch(startTimeVal, (newMs, oldMs) => {
    if (oldMs != null && newMs !== oldMs) {
      showPrompt.value = false;
    }
  });

  const endDateKey = computed(() => dateKey(localRange.value?.[1]));
  watch(endDateKey, (newK, oldK) => {
    if (newK && newK !== oldK) {
      promptWord.value = "end time";
      showPrompt.value = true;
    }
  });

  const endTimeVal = computed(() =>
    localRange.value?.[1] instanceof Date ? localRange.value[1].getTime() : null
  );
  watch(endTimeVal, (newMs, oldMs) => {
    if (oldMs != null && newMs !== oldMs) {
      showPrompt.value = false;
    }
  });

  const startDateKey = computed(() => dateKey(localRange.value?.[0]));
  watch(startDateKey, (newK, oldK) => {
    if (newK && newK !== oldK) {
      promptWord.value = "start time";
      showPrompt.value = true;
    }
  });

  function clear(event?: MouseEvent) {
    localRange.value = null;
    options.onChange?.([]);
    const evt = event ?? new MouseEvent("click");
    if (evt && typeof evt.preventDefault === "function") {
      evt.preventDefault();
    }
    (
      dp.value as { onClearButtonClick?: (e: MouseEvent) => void }
    )?.onClearButtonClick?.(evt);
    showPrompt.value = false;
  }

  function today(event?: MouseEvent) {
    const evt = event ?? new MouseEvent("click");
    if (evt && typeof evt.preventDefault === "function") {
      evt.preventDefault();
    }
    (
      dp.value as { onTodayButtonClick?: (e: MouseEvent) => void }
    )?.onTodayButtonClick?.(evt);
    showPrompt.value = false;
  }

  function formatDate(d: Date) {
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, "0");
    const D = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${Y}-${M}-${D} ${h}:${m}`;
  }

  function confirm(event: MouseEvent) {
    event.preventDefault();
    attempted.value = true;
    if (!isComplete.value) {
      return;
    }
    const [start, end] = localRange.value as Date[];
    const formatted = [formatDate(start), formatDate(end)];
    options.onChange?.(formatted);
    if (
      dp.value &&
      typeof (dp.value as { hideOverlay?: (e: MouseEvent) => void })
        .hideOverlay === "function"
    ) {
      (dp.value as { hideOverlay: (e: MouseEvent) => void }).hideOverlay(event);
    } else if (dp.value) {
      (dp.value as { overlayVisible: boolean }).overlayVisible = false;
    }
    showPrompt.value = false;
  }

  function onShow() {
    attempted.value = false;
    showPrompt.value = false;
  }

  function onDateChange(
    value: Date | Date[] | (Date | null)[] | null | undefined
  ) {
    let arr: Date[] | null = null;
    if (Array.isArray(value)) {
      arr = value.filter((v): v is Date => v instanceof Date) as Date[];
    } else if (value instanceof Date) {
      arr = [value];
    } else {
      arr = null;
    }
    localRange.value = arr;
    if (arr && arr.length === 2 && arr[0] && arr[1]) {
      const formatted = [formatDate(arr[0]), formatDate(arr[1])];
      options.onChange?.(formatted);
    } else {
      options.onChange?.([]);
    }
  }

  return {
    dp,
    attempted,
    showPrompt,
    promptWord,
    localRange,
    isComplete,
    clear,
    today,
    confirm,
    onShow,
    onDateChange,
  };
}
