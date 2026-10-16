// Time left until `iso` at instant `now` (ms). A date that has passed, or one that cannot be parsed,
// gives zeros instead of NaN, so a half-typed date in the Studio never prints "NaN days".
export function remaining(iso, now) {
  const target = new Date(iso).getTime()
  const diff = Number.isFinite(target) ? Math.max(0, target - now) : 0
  return {
    days: Math.floor(diff / 864e5),
    hours: Math.floor(diff / 36e5) % 24,
    minutes: Math.floor(diff / 6e4) % 60,
    seconds: Math.floor(diff / 1e3) % 60,
    done: diff === 0,
  }
}
