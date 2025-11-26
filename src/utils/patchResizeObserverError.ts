/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
// Suppress noisy ResizeObserver loop errors in dev overlays and prevent the root cause by deferring callbacks
(() => {
    if (typeof window === "undefined") return;

    // 1) Patch ResizeObserver to avoid triggering the Chromium runtime error in the first place
    try {
        const NativeRO: typeof window.ResizeObserver | undefined = (window as any).ResizeObserver;
        const marker = "__patched_by_tpce__";
        if (NativeRO && !(NativeRO as any)[marker]) {
            class PatchedResizeObserver implements ResizeObserver {
                private _ro: ResizeObserver;
                constructor(callback: ResizeObserverCallback) {
                    // Defer the callback into rAF to break resize → mutation → resize loops
                    const safeCb: ResizeObserverCallback = (entries, observer) => {
                        try {
                            // schedule to next frame to avoid loop limit exceeded
                            requestAnimationFrame(() => {
                                try {
                                    callback(entries, observer);
                                } catch (err) {
                                    // swallow to avoid bubbling into global error handlers
                                }
                            });
                        } catch (err) {
                            // swallow
                        }
                    };
                    this._ro = new (NativeRO as any)(safeCb);
                }
                observe: ResizeObserver["observe"] = (target: Element, options?: ResizeObserverOptions) =>
                    this._ro.observe(target, options as any);
                unobserve: ResizeObserver["unobserve"] = (target: Element) => this._ro.unobserve(target);
                disconnect: ResizeObserver["disconnect"] = () => this._ro.disconnect();
            }
            (PatchedResizeObserver as any)[marker] = true;
            (NativeRO as any)[marker] = true;
            (window as any).ResizeObserver = PatchedResizeObserver as any;
        }
    } catch (e) {
        // no-op if environment doesn't support ResizeObserver
    }

    // 2) As a safety net, intercept overlay handlers for known RO messages
    const isResizeObserverMessage = (msg: unknown) => {
        if (typeof msg !== "string") return false;
        // Cover common Chromium messages
        // - "ResizeObserver loop limit exceeded"
        // - "ResizeObserver loop completed with undelivered notifications"
        // - Any vendor phrasing containing "ResizeObserver"
        return (
            msg.includes("ResizeObserver loop limit exceeded") ||
            msg.includes("ResizeObserver loop completed with undelivered notifications") ||
            msg.includes("ResizeObserver")
        );
    };

    // Capture-phase handler runs before many overlay listeners; this may still
    // execute after if they registered earlier, so we also patched RO above.
    const ignoreResizeObserverError = (e: ErrorEvent) => {
        const msg = e?.message || (e?.error as { message?: string })?.message || "";
        if (isResizeObserverMessage(msg)) {
            e.stopImmediatePropagation();
            e.preventDefault?.();
        }
    };
    window.addEventListener("error", ignoreResizeObserverError, true);

    // In rare cases errors surface via unhandledrejection with message on reason
    const ignoreResizeObserverRejection = (e: PromiseRejectionEvent) => {
        const reason = e?.reason as { message?: string } | string | undefined;
        const msg = typeof reason === "string" ? reason : reason?.message || "";
        if (isResizeObserverMessage(msg)) {
            e.stopImmediatePropagation();
            e.preventDefault?.();
        }
    };
    window.addEventListener("unhandledrejection", ignoreResizeObserverRejection, true);

    // Last resort: filter console.error spam for the specific phrase only in dev
    const originalConsoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
        const first = args?.[0];
        if (isResizeObserverMessage(typeof first === "string" ? first : "")) {
            return;
        }
        return originalConsoleError(...args);
    };
})();
