function pad(n: number) { return String(n).padStart(2, '0') }

/** Anonymous Gregorian algorithm — returns the Easter Sunday date for a given year. */
export function getEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/** Returns the ISO date string (YYYY-MM-DD) for a pascal-relative holiday in a given year. */
export function getPascalDate(year: number, offset: number): string {
  const easter = getEasterDate(year)
  const d = new Date(easter.getTime() + offset * 86_400_000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
