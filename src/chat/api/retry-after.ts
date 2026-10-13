// The mock uses delta-seconds. HTTP-date is supported for an equivalent real API.
export function retryAfterMs(
  value: string | null,
  nowMs: number,
): number | null {
  if (value === null || value.trim() === "") return null;
  if (/^\d+$/.test(value.trim())) {
    const delay = Number(value) * 1000;
    return Number.isSafeInteger(delay) ? delay : null;
  }
  if (!value.trim().endsWith("GMT")) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - nowMs) : null;
}

export const POLL_ERROR_DELAY_MS = 3000;
