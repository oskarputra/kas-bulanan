import { addDays, lastDayOfMonth, parts, weekday, ymd, type Ymd } from './dates'

export type Rule = { day: number; weekendShift: boolean; effectiveFrom: Ymd }
export type Period = { start: Ymd; end: Ymd } // end inklusif

/** Tanggal gajian untuk "bulan nominal" ke-k (k = tahun*12 + bulan). */
export function paydayFor(k: number, rule: Pick<Rule, 'day' | 'weekendShift'>): Ymd {
  const y = Math.floor(k / 12)
  const m = k - y * 12
  const d = Math.min(rule.day, lastDayOfMonth(y, m))
  let s = ymd(y, m, d)
  if (rule.weekendShift) {
    const w = weekday(s)
    if (w === 6) s = addDays(s, -1) // Sabtu -> Jumat
    if (w === 0) s = addDays(s, -2) // Minggu -> Jumat
  }
  return s
}

const monthIndex = (s: Ymd) => { const { y, m } = parts(s); return y * 12 + m }

/** Urutkan aturan dari yang paling lama. */
function sorted(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : a.effectiveFrom > b.effectiveFrom ? 1 : 0))
}

export function ruleAt(date: Ymd, rules: Rule[]): { rule: Rule; next?: Rule } {
  const list = sorted(rules)
  if (list.length === 0) throw new Error('Belum ada aturan tanggal gajian')
  let i = 0
  for (let j = 0; j < list.length; j++) if (list[j].effectiveFrom <= date) i = j
  return { rule: list[i], next: list[i + 1] }
}

/** Periode gajian yang memuat tanggal tertentu. */
export function periodOf(date: Ymd, rules: Rule[]): Period {
  const list = sorted(rules)
  const { rule, next } = ruleAt(date, list)
  let k = monthIndex(date)
  if (date < paydayFor(k, rule)) k -= 1
  else if (date >= paydayFor(k + 1, rule)) k += 1
  let start = paydayFor(k, rule)
  let end = addDays(paydayFor(k + 1, rule), -1)
  // Batasi oleh pergantian aturan supaya periode tidak tumpang tindih
  if (rule !== list[0] && start < rule.effectiveFrom) start = rule.effectiveFrom
  if (next && end >= next.effectiveFrom) end = addDays(next.effectiveFrom, -1)
  return { start, end }
}

export function previousPeriod(p: Period, rules: Rule[]): Period {
  return periodOf(addDays(p.start, -1), rules)
}

export function nextPeriod(p: Period, rules: Rule[]): Period {
  return periodOf(addDays(p.end, 1), rules)
}

/** Daftar n periode terakhir, dari yang paling lama sampai periode p. */
export function lastPeriods(p: Period, n: number, rules: Rule[]): Period[] {
  const out = [p]
  while (out.length < n) out.unshift(previousPeriod(out[0], rules))
  return out
}
