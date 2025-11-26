import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

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
  const manualStart = ref("");
  const manualEnd = ref("");
  const manualErrors = ref({ start: false, end: false });

  // Helper to apply an external range (string[] or Date[]) to local state
  function applyInitialRange(range?: string[] | Date[] | null) {
    if (Array.isArray(range) && range.length === 2) {
      localRange.value = (range as (string | Date)[]).map((s) =>
        s instanceof Date ? s : new Date(String(s).replace(" ", "T"))
      );
      syncManualFields();
      manualErrors.value = { start: false, end: false };
    }
  }

  // Restore any previously‑saved range once on init
  applyInitialRange(options.initialRange ?? null);

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

  function syncManualFields() {
    manualStart.value = localRange.value?.[0]
      ? formatDate(localRange.value[0])
      : "";
    manualEnd.value = localRange.value?.[1]
      ? formatDate(localRange.value[1])
      : "";
  }

  watch(
    () => localRange.value && localRange.value.map((d) => d?.getTime()),
    () => {
      syncManualFields();
      manualErrors.value = { start: false, end: false };
    },
    { immediate: true }
  );

  function parseManualValue(value: string): Date | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = dayjs(trimmed, "YYYY-MM-DD HH:mm", true);
    return parsed.isValid() ? parsed.toDate() : null;
  }

  function emitRange(range: Date[] | null) {
    if (range && range.length === 2 && range[0] && range[1]) {
      const formatted = [formatDate(range[0]), formatDate(range[1])];
      options.onChange?.(formatted);
    } else {
      options.onChange?.([]);
    }
  }

  function updateManualSegment(part: "start" | "end") {
    const value = part === "start" ? manualStart.value : manualEnd.value;
    const trimmed = value.trim();
    const parsed = parseManualValue(value);
    manualErrors.value = {
      ...manualErrors.value,
      [part]: Boolean(trimmed) && !parsed,
    };

    if (!trimmed) {
      // Clearing input removes that segment
      const current: Array<Date | undefined> = localRange.value
        ? [...localRange.value]
        : [];
      current[part === "start" ? 0 : 1] = undefined;
      const filtered = current.filter((d): d is Date => d instanceof Date);
      localRange.value = filtered.length ? filtered : null;
      emitRange(localRange.value);
      return;
    }

    if (!parsed) {
      return;
    }

    const currentStart = localRange.value?.[0] ?? null;
    const currentEnd = localRange.value?.[1] ?? null;
    const nextStart = part === "start" ? parsed : currentStart;
    const nextEnd = part === "end" ? parsed : currentEnd;

    if (nextStart && nextEnd && nextStart.getTime() > nextEnd.getTime()) {
      manualErrors.value = {
        start: part === "end",
        end: part === "start",
      };
      return;
    }

    const nextRange: Date[] = [];
    if (nextStart) {
      nextRange[0] = nextStart;
    }
    if (nextEnd) {
      nextRange[1] = nextEnd;
    }
    localRange.value = nextRange.length ? nextRange : null;
    manualErrors.value = { start: false, end: false };
    emitRange(localRange.value);
  }

  function selectAllText(event: Event) {
    const input = event.target as HTMLInputElement | null;
    input?.select?.();
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
    emitRange(arr);
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
    manualStart,
    manualEnd,
    manualErrors,
    updateManualSegment,
    selectAllText,
  };
}
