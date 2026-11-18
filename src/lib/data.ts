import 'server-only'
import { and, asc, desc, eq, gte, lte, sql, inArray } from 'drizzle-orm'
import { db, schema } from '@/db'
import type { User } from '@/db/schema'
import { addDays, daysBetween, todayYmd, type Ymd } from './dates'
import { lastPeriods, periodOf, previousPeriod, type Period, type Rule } from './period'
import { category } from './categories'

const { transactions: tx, savingTxs, recurringItems, recurringPayments, pots, paydayRules } = schema

export async function getRules(userId: string): Promise<Rule[]> {
  const rows = await db.select().from(paydayRules).where(eq(paydayRules.userId, userId)).orderBy(asc(paydayRules.effectiveFrom))
  if (rows.length === 0) return [{ day: 25, weekendShift: true, effectiveFrom: '2000-01-01' }]
  return rows.map((r) => ({ day: r.day, weekendShift: r.weekendShift, effectiveFrom: r.effectiveFrom }))
}

export async function getContext(user: User) {
  const today = todayYmd()
  const rules = await getRules(user.id)
  const period = periodOf(today, rules)
  return { today, rules, period }
}

type Totals = { income: number; out: number; outRecurring: number; outDaily: number; deposits: number; withdrawals: number }

export async function totalsFor(userId: string, p: Period): Promise<Totals> {
  const [t] = await db
    .select({
      income: sql<number>`coalesce(sum(case when ${tx.type} = 'in' then ${tx.amount} end), 0)::bigint`,
      out: sql<number>`coalesce(sum(case when ${tx.type} = 'out' then ${tx.amount} end), 0)::bigint`,
      outRecurring: sql<number>`coalesce(sum(case when ${tx.type} = 'out' and ${tx.source} = 'recurring' then ${tx.amount} end), 0)::bigint`,
    })
    .from(tx)
    .where(and(eq(tx.userId, userId), gte(tx.date, p.start), lte(tx.date, p.end)))
  const [s] = await db
    .select({
      deposits: sql<number>`coalesce(sum(case when ${savingTxs.amount} > 0 then ${savingTxs.amount} end), 0)::bigint`,
      withdrawals: sql<number>`coalesce(sum(case when ${savingTxs.amount} < 0 then -${savingTxs.amount} end), 0)::bigint`,
    })
    .from(savingTxs)
    .where(and(eq(savingTxs.userId, userId), gte(savingTxs.date, p.start), lte(savingTxs.date, p.end)))
  const out = Number(t.out), outRecurring = Number(t.outRecurring)
  return {
    income: Number(t.income), out, outRecurring, outDaily: out - outRecurring,
    deposits: Number(s.deposits), withdrawals: Number(s.withdrawals),
  }
}

export async function recurringStatus(userId: string, p: Period) {
  const items = await db.select().from(recurringItems)
    .where(and(eq(recurringItems.userId, userId), eq(recurringItems.active, true)))
    .orderBy(asc(recurringItems.kind), asc(recurringItems.createdAt))
  const ids = items.map((i) => i.id)
  const pays = ids.length
    ? await db.select().from(recurringPayments).where(and(inArray(recurringPayments.itemId, ids), eq(recurringPayments.periodStart, p.start)))
    : []
  const potRows = await db.select({ id: pots.id, name: pots.name }).from(pots).where(eq(pots.userId, userId))
  return items.map((item) => {
    const pay = pays.find((x) => x.itemId === item.id)
    return {
      item,
      paid: !!pay,
      paidAmount: pay?.amount ?? 0,
      paidAt: pay?.paidAt ?? null,
      potName: item.potId ? potRows.find((x) => x.id === item.potId)?.name ?? null : null,
      dueDate: item.dueDay ? dueDateIn(p, item.dueDay) : null,
    }
  })
}

/** Tanggal jatuh tempo (hari ke-n dalam kalender) yang jatuh di dalam periode. */
function dueDateIn(p: Period, dueDay: number): Ymd | null {
  for (let d = p.start; d <= p.end; d = addDays(d, 1)) if (Number(d.slice(8)) === dueDay) return d
  return null
}

export async function recentTransactions(userId: string, limit = 8) {
  return db.select().from(tx).where(eq(tx.userId, userId)).orderBy(desc(tx.date), desc(tx.createdAt)).limit(limit)
}

export async function dailyOut(userId: string, from: Ymd, to: Ymd) {
  const rows = await db.select({ date: tx.date, total: sql<number>`sum(${tx.amount})::bigint` })
    .from(tx)
    .where(and(eq(tx.userId, userId), eq(tx.type, 'out'), eq(tx.source, 'manual'), gte(tx.date, from), lte(tx.date, to)))
    .groupBy(tx.date)
  const map = new Map(rows.map((r) => [r.date, Number(r.total)]))
  const out: { date: Ymd; total: number }[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ date: d, total: map.get(d) ?? 0 })
  return out
}

export async function potBalances(userId: string) {
  const [list, sums] = await Promise.all([
    db.select().from(pots).where(and(eq(pots.userId, userId), eq(pots.archived, false))).orderBy(asc(pots.createdAt)),
    db.select({ potId: savingTxs.potId, balance: sql<number>`sum(${savingTxs.amount})::bigint` })
      .from(savingTxs).where(eq(savingTxs.userId, userId)).groupBy(savingTxs.potId),
  ])
  return list.map((p) => ({ ...p, balance: Number(sums.find((x) => x.potId === p.id)?.balance ?? 0) }))
}

export async function byCategory(userId: string, p: Period) {
  const rows = await db.select({ category: tx.category, total: sql<number>`sum(${tx.amount})::bigint`, count: sql<number>`count(*)::int` })
    .from(tx)
    .where(and(eq(tx.userId, userId), eq(tx.type, 'out'), gte(tx.date, p.start), lte(tx.date, p.end)))
    .groupBy(tx.category)
  return rows.map((r) => ({ category: r.category, total: Number(r.total), count: Number(r.count) })).sort((a, b) => b.total - a.total)
}

export async function dashboard(user: User) {
  const { today, rules, period } = await getContext(user)
  const [totals, rec, recent, week, potsList] = await Promise.all([
    totalsFor(user.id, period),
    recurringStatus(user.id, period),
    recentTransactions(user.id, 8),
    dailyOut(user.id, addDays(today, -6), today),
    potBalances(user.id),
  ])
  const income = totals.income > 0 ? totals.income : user.salary
  const sisa = income - totals.out - totals.deposits + totals.withdrawals
  const unpaid = rec.filter((r) => !r.paid)
  const unpaidSum = unpaid.reduce((s, r) => s + r.item.amount, 0)
  const spendable = sisa - unpaidSum
  const daysLeft = Math.max(1, daysBetween(today, period.end) + 1)
  const totalDays = daysBetween(period.start, period.end) + 1
  const elapsed = daysBetween(period.start, today) + 1
  const recTotal = rec.reduce((s, r) => s + (r.paid ? r.paidAmount : r.item.amount), 0)
  const recPaid = rec.filter((r) => r.paid).reduce((s, r) => s + r.paidAmount, 0)
  const insight = await weeklyInsight(user.id, today)
  return {
    today, period, rules, income, incomeIsEstimate: totals.income === 0, totals,
    sisa, spendable, perDay: Math.max(0, Math.floor(spendable / daysLeft)), daysLeft, totalDays, elapsed,
    unpaid, unpaidSum, recCount: rec.length, recPaidCount: rec.length - unpaid.length, recTotal, recPaid,
    recent, week, savingsTotal: potsList.reduce((s, p) => s + p.balance, 0), potCount: potsList.length,
    insight,
  }
}

/** Kategori yang minggu ini jauh di atas rata-rata mingguan 8 minggu sebelumnya. */
async function weeklyInsight(userId: string, today: Ymd): Promise<string | null> {
  const weekStart = addDays(today, -6)
  const histStart = addDays(today, -62)
  const rows = await db.select({
    category: tx.category,
    thisWeek: sql<number>`coalesce(sum(case when ${tx.date} >= ${weekStart} then ${tx.amount} end), 0)::bigint`,
    before: sql<number>`coalesce(sum(case when ${tx.date} < ${weekStart} then ${tx.amount} end), 0)::bigint`,
  })
    .from(tx)
    .where(and(eq(tx.userId, userId), eq(tx.type, 'out'), eq(tx.source, 'manual'), gte(tx.date, histStart), lte(tx.date, today)))
    .groupBy(tx.category)
  let best: { label: string; diff: number } | null = null
  for (const r of rows) {
    const avg = Number(r.before) / 8
    const diff = Number(r.thisWeek) - avg
    if (avg > 0 && diff >= 50000 && diff / avg >= 0.2 && (!best || diff > best.diff)) best = { label: category(r.category).label, diff }
  }
  if (!best) return null
  return `Pengeluaran ${best.label.toLowerCase()} minggu ini ${Math.round(best.diff / 1000)} rb lebih tinggi dari rata-rata mingguanmu.`
}

export async function report(user: User, anyDate: Ymd) {
  const rules = await getRules(user.id)
  const today = todayYmd()
  const period = periodOf(anyDate > today ? today : anyDate, rules)
  const periods = lastPeriods(period, 6, rules)
  const totals = await Promise.all(periods.map((p) => totalsFor(user.id, p)))
  const prev = previousPeriod(period, rules)
  const [cats, prevCats, prevTotals] = await Promise.all([byCategory(user.id, period), byCategory(user.id, prev), totalsFor(user.id, prev)])
  const cur = totals[totals.length - 1]
  const income = cur.income > 0 ? cur.income : user.salary
  const nonZero = totals.slice(0, -1).filter((t) => t.out > 0) // rata-rata periode sebelumnya
  const avg = nonZero.length ? nonZero.reduce((s, t) => s + t.out, 0) / nonZero.length : 0
  const categories = cats.map((c) => {
    const before = prevCats.find((x) => x.category === c.category)?.total ?? 0
    return { ...c, before, delta: before > 0 ? (c.total - before) / before : null }
  })
  const savingRate = income > 0 ? (cur.deposits - cur.withdrawals) / income : 0
  return {
    today, period, prev, isCurrent: period.start <= today && today <= period.end,
    bars: periods.map((p, i) => ({ period: p, out: totals[i].out })),
    avg, totals: cur, prevTotals, income, incomeIsEstimate: cur.income === 0, categories, savingRate,
  }
}

export async function transactionsIn(userId: string, p: Period) {
  return db.select().from(tx).where(and(eq(tx.userId, userId), gte(tx.date, p.start), lte(tx.date, p.end))).orderBy(desc(tx.date), desc(tx.createdAt))
}
