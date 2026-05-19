// Coordinates the boot splash with heavy async work (currently: the VRM avatar
// on the Astra card). Modules that own such work:
//   • call `markRequested()` when they start
//   • call `setProgress(0..1)` as bytes/assets arrive
//   • call `markReady()` when the first frame has been presented to the user
//
// The boot splash subscribes, shows the progress while it waits, and only
// fades out once `ready` is true — so the user never sees a freeze in the gap
// between splash hiding and the model arriving.

type Signal = {
  requested: boolean;
  ready: boolean;
  progress: number; // 0..1
  lastProgressAt: number; // performance.now() of the last progress tick
};

const state: Signal = {
  requested: false,
  ready: false,
  progress: 0,
  lastProgressAt: 0,
};
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

export const bootSignal = {
  markRequested() {
    if (state.requested) return;
    state.requested = true;
    state.lastProgressAt = performance.now();
    notify();
  },
  setProgress(p: number) {
    const clamped = Math.max(0, Math.min(1, p));
    if (clamped <= state.progress) return; // monotonic
    state.progress = clamped;
    state.lastProgressAt = performance.now();
    notify();
  },
  markReady() {
    if (state.ready) return;
    state.ready = true;
    state.progress = 1;
    notify();
  },
  get(): Readonly<Signal> {
    return state;
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
