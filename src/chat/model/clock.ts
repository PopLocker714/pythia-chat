export interface Clock {
  now(): number;
  waitUntil(deadline: number, signal: AbortSignal): Promise<void>;
}

export const systemClock: Clock = {
  now: Date.now,
  waitUntil(deadline, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error("Polling stopped"));
        return;
      }
      const abort = () => {
        clearTimeout(timer);
        reject(new Error("Polling stopped"));
      };
      const timer = setTimeout(
        () => {
          signal.removeEventListener("abort", abort);
          resolve();
        },
        Math.max(0, deadline - Date.now()),
      );
      signal.addEventListener("abort", abort, { once: true });
    });
  },
};
