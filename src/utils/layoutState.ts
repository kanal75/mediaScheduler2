// layoutState.ts
// Utilities for normalizing and diffing AG Grid layout state objects.
// We purposefully focus on keys that impact visible layout: columns order/width/visibility, sort, filter, group, pivot.

export interface NormalizedLayoutState {
  colState?: Array<{
    colId?: string;
    width?: number;
    hide?: boolean;
    pinned?: string | null;
    sort?: string | null;
    sortIndex?: number | null;
    __order?: number; // preserved visual order index
  }>;
  colOrderSignature?: string; // compact representation of order to detect moves
  sortModel?: unknown;
  filterModel?: unknown;
  rowGroupColumns?: unknown;
  pivotColumns?: unknown;
  version?: number;
}

// Shallow pick & stable sort of column state by colId to avoid order noise when comparing
export function normalizeLayoutState(raw: any): NormalizedLayoutState {
  if (!raw || typeof raw !== "object") return {};
  const out: NormalizedLayoutState = {};
  const colState = (raw.columnState || raw.colState || raw.columns) as
    | any[]
    | undefined;
  if (Array.isArray(colState)) {
    // Preserve actual order (index) to detect reorders
    out.colState = colState.map((c, idx) => ({
      colId: c.colId,
      width: typeof c.width === "number" ? c.width : undefined,
      hide: c.hide === true ? true : c.hide === false ? false : undefined,
      pinned: c.pinned ?? null,
      sort: c.sort ?? null,
      sortIndex: c.sortIndex ?? null,
      __order: idx,
    }));
    out.colOrderSignature = out.colState.map((c) => c.colId).join("|");
  }
  if (raw.sortModel) out.sortModel = raw.sortModel;
  if (raw.filterModel) out.filterModel = raw.filterModel;
  if (raw.rowGroupColumns) out.rowGroupColumns = raw.rowGroupColumns;
  if (raw.pivotColumns) out.pivotColumns = raw.pivotColumns;
  if (raw.layoutVersion) out.version = raw.layoutVersion;
  return out;
}

function safeJson(v: unknown) {
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}

// Determine if two normalized states differ in a meaningful way.
export function areStatesMeaningfullyDifferent(a: any, b: any): boolean {
  const na = normalizeLayoutState(a);
  const nb = normalizeLayoutState(b);
  return safeJson(na) !== safeJson(nb);
}

// Debug helper to inspect normalized snapshots (attachable in console if needed)
export function __debugNormalize(raw: any) {
  return normalizeLayoutState(raw);
}
