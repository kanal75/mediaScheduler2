<template>
  <div
    class="specific-times-cell"
    aria-label="Full specific times list"
    :title="tooltipText"
  >
    <template v-if="normalizedRanges.length">
      <div
        v-for="(r, index) in normalizedRanges"
        :key="index"
        class="range-row"
      >
        <Tag v-if="r.allDay" severity="success" class="mr-1">All Day</Tag>
        <template v-else>
          <Tag v-if="r.from" severity="info" class="mr-1">{{ r.from }}</Tag>
          <Icon v-if="r.from && r.to" name="arrow-right" class="mr-1 arrow" />
          <Tag v-if="r.to" severity="success" class="mr-1">{{ r.to }}</Tag>
        </template>
        <span v-if="r.daysLabels && r.daysLabels.length" class="days-group">
          <Tag
            v-if="r.daysLabels.length === 7"
            severity="secondary"
            class="mr-1 days-tag"
          >
            All week
          </Tag>
          <template v-else>
            <Tag
              v-for="(d, i) in r.daysLabels"
              :key="i"
              severity="secondary"
              class="mr-1 days-tag"
            >
              {{ d }}
            </Tag>
          </template>
        </span>
      </div>
    </template>
    <span v-else class="empty">—</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import Icon from "@/components/icons/Icon.vue";
import dayjs from "dayjs";
import Tag from "primevue/tag";
// OverlayPanel removed per request; using native title tooltip instead

// Types covering both legacy and new formats
type SpecificTimesObject = {
  days?: Array<string | number>;
  from?: string;
  to?: string;
  allDay?: boolean;
};

type CellValue =
  | SpecificTimesObject[]
  | SpecificTimesObject
  | string[][]
  | string[]
  | null
  | undefined;

type CellParams = {
  value?: CellValue;
  data?: {
    specificTimes?: CellValue;
    timePicker?: string[];
    specificTime?: boolean;
  };
};

type NormalizedRange = {
  daysLabels: string[];
  from: string;
  to: string;
  allDay: boolean;
};

const weekdays = [
  { short: "Mon", long: "Monday" },
  { short: "Tue", long: "Tuesday" },
  { short: "Wed", long: "Wednesday" },
  { short: "Thu", long: "Thursday" },
  { short: "Fri", long: "Friday" },
  { short: "Sat", long: "Saturday" },
  { short: "Sun", long: "Sunday" },
];

function toShortDayLabels(days: Array<string | number> | undefined): string[] {
  if (!Array.isArray(days)) return [];
  return days
    .map((d) => {
      if (typeof d === "number") return weekdays[d]?.short;
      const idx = weekdays.findIndex((w) => w.long === d || w.short === d);
      return idx >= 0 ? weekdays[idx].short : undefined;
    })
    .filter((v): v is string => Boolean(v));
}

function formatMaybeTime(val?: string): string {
  if (!val) return "";
  // If looks like full date or ISO, format to HH:mm
  if (val.length > 5 || /T|\d{4}-\d{2}-\d{2}/.test(val)) {
    const d = dayjs(val);
    if (d.isValid()) return d.format("HH:mm");
  }
  return val;
}

function isFullDayFromTo(from?: string, to?: string): boolean {
  const f = formatMaybeTime(from);
  const t = formatMaybeTime(to);
  return f === "00:00" && t === "23:59";
}

function parseMaybeJSON(input: unknown): unknown {
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }
  return input;
}

export default defineComponent({
  name: "SpecificTimesCellRender",
  components: { Tag, Icon },
  props: {
    params: { type: Object as PropType<CellParams>, required: true },
  },
  setup(props) {
    // No overlay: keep only computed values
    const rowSpecificTimes = computed<CellValue>(() => {
      const st = parseMaybeJSON(props.params?.data?.specificTimes);
      return (st ?? []) as CellValue;
    });

    const valueOrData = computed<CellValue>(() => {
      // Prefer the row's specificTimes if present
      const rowVal = rowSpecificTimes.value;
      if (Array.isArray(rowVal) && rowVal.length > 0) return rowVal;
      const fromValue = parseMaybeJSON(props.params?.value);
      if (fromValue !== undefined && fromValue !== null) {
        return fromValue as CellValue;
      }
      return [] as CellValue;
    });

    const normalizedRanges = computed<NormalizedRange[]>(() => {
      const val = valueOrData.value;
      if (!val) return [];

      const out: NormalizedRange[] = [];

      // New format: array of objects: { days, from, to, allDay }
      if (
        Array.isArray(val) &&
        val.length &&
        typeof (val as unknown as Record<string, unknown>[])[0] === "object" &&
        (val as unknown as Record<string, unknown>[])[0] !== null
      ) {
        for (const r of val as SpecificTimesObject[]) {
          if (r && ("from" in r || "to" in r || "allDay" in r || "days" in r)) {
            out.push({
              daysLabels: toShortDayLabels(r.days),
              from: formatMaybeTime(typeof r.from === "string" ? r.from : ""),
              to: formatMaybeTime(typeof r.to === "string" ? r.to : ""),
              allDay: isFullDayFromTo(r.from, r.to),
            });
          }
        }
        return out;
      }

      // Old format variants
      // 1) [ ["08:00","12:00"], ["13:00","17:00"] ]
      if (Array.isArray(val) && val.length && Array.isArray(val[0])) {
        for (const arr of val as string[][]) {
          if (
            Array.isArray(arr) &&
            (typeof arr[0] === "string" || typeof arr[1] === "string")
          ) {
            out.push({
              daysLabels: [],
              from: formatMaybeTime(arr[0] || ""),
              to: formatMaybeTime(arr[1] || ""),
              allDay: isFullDayFromTo(arr[0], arr[1]),
            });
          }
        }
        return out;
      }

      // 2) ["08:00","12:00"]
      if (
        Array.isArray(val) &&
        (typeof (val as string[])[0] === "string" ||
          typeof (val as string[])[1] === "string")
      ) {
        const vv = val as string[];
        out.push({
          daysLabels: [],
          from: formatMaybeTime(vv[0] || ""),
          to: formatMaybeTime(vv[1] || ""),
          allDay: isFullDayFromTo(vv[0], vv[1]),
        });
        return out;
      }

      // 3) Single object { from, to }
      if (typeof val === "object" && val) {
        const v = val as SpecificTimesObject;
        if (typeof v.from === "string" || typeof v.to === "string") {
          out.push({
            daysLabels: toShortDayLabels(v.days),
            from: formatMaybeTime(v.from || ""),
            to: formatMaybeTime(v.to || ""),
            allDay: isFullDayFromTo(v.from, v.to),
          });
          return out;
        }
      }

      return out;
    });

    const tooltipText = computed(() => {
      const list = normalizedRanges.value;
      if (!list || !list.length) return "";
      return list
        .map((r) => {
          const timePart = r.allDay
            ? "All Day"
            : [r.from, r.to]
                .filter((v) => v && String(v).trim().length)
                .join(" - ");
          let daysPart = "";
          if (Array.isArray(r.daysLabels) && r.daysLabels.length) {
            daysPart =
              r.daysLabels.length === 7
                ? " (All week)"
                : ` (${r.daysLabels.join(", ")})`;
          }
          return `${timePart}${daysPart}`;
        })
        .join("\n");
    });

    return {
      normalizedRanges,
      tooltipText,
    };
  },
});
</script>

<style scoped>
.specific-times-cell {
  display: flex;
  flex-direction: column;
  gap: 8px; /* more space between in-cell rows */
  /* ensure left alignment inside AG Grid cells */
  align-items: flex-start;
  text-align: left;
  width: 100%;
}
.range-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px; /* more space between tags within a row */
  justify-content: flex-start;
}
.mr-1 {
  margin-right: 8px; /* more breathing room between adjacent tags */
}
.arrow {
  opacity: 0.7;
  font-size: 0.85rem;
}
.empty {
  opacity: 0.6;
  font-style: italic;
}

/* Tighten Tag paddings a bit inside grid cells */
:deep(.p-tag) {
  padding: 0.15rem 0.35rem;
  font-size: 0.75rem;
}
.days-tag :deep(.p-tag-value) {
  letter-spacing: 0.2px;
}
.days-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px; /* more space between day chips */
}
/* Overlay card removed; no related styles needed */
</style>
