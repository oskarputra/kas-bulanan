'use server'

import bcrypt from 'bcryptjs'
import { and, desc, eq, gte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db, schema } from '@/db'
import { createSession, destroySession, requireUser } from './auth'
import { addDays, isYmd, todayYmd } from './dates'
import { parseAmount } from './money'
import { periodOf } from './period'
import { getRules } from './data'
import { IN_KEYS, OUT_KEYS, POT_COLORS } from './categories'

export type FormState = { error?: string; fields?: Record<string, string> } | undefined

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const COMMON_PW = /^(12345678|123456789|password|qwerty|11111111|00000000)/i

function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Kata sandi minimal 8 karakter.'
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'Kata sandi perlu berisi huruf dan angka.'
  if (COMMON_PW.test(pw)) return 'Kata sandi terlalu umum. Pakai yang lebih sulit ditebak.'
  return null
}

function done(path = '/'): never {
  revalidatePath('/', 'layout')
  redirect(path)
}

// ---------- Akun

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, 'name')
  const email = str(fd, 'email').toLowerCase()
  const password = String(fd.get('password') ?? '')
  const day = Number(fd.get('payday'))
  const salary = parseAmount(fd.get('salary'))
  const fields = { name, email, payday: String(day || 25), salary: str(fd, 'salary') }
  if (!name) return { error: 'Isi nama dulu.', fields }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Format email belum benar, contoh: nama@email.com.', fields }
  const pwErr = passwordProblem(password)
  if (pwErr) return { error: pwErr, fields }
  if (fd.get('agree') !== 'on') return { error: 'Centang persetujuan ketentuan untuk melanjutkan.', fields }
  if (!(day >= 1 && day <= 31)) return { error: 'Tanggal gajian harus 1 sampai 31.', fields }

  const exists = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1)
  if (exists.length) return { error: 'Email ini sudah terdaftar. Masuk dengan email tersebut, atau pakai email lain.', fields }

  const passwordHash = await bcrypt.hash(password, 11)
  const [user] = await db.insert(schema.users).values({ name, email, passwordHash, salary }).returning()
  await db.insert(schema.paydayRules).values({ userId: user.id, day, weekendShift: true, effectiveFrom: '2000-01-01' })
  await createSession(user.id)
  done('/')
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email').toLowerCase()
  const password = String(fd.get('password') ?? '')
  const remember = fd.get('remember') === 'on'
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
  // Bandingkan dengan hash palsu kalau email tidak ada supaya waktunya sama
  const ok = await bcrypt.compare(password, user?.passwordHash ?? '$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv')
  if (!user || !ok) return { error: 'Email atau kata sandi salah. Cek lagi, lalu coba masuk lagi.', fields: { email } }
  await createSession(user.id, remember)
  done('/')
}

export async function logout() {
  await destroySession()
  redirect('/masuk')
}

// ---------- Transaksi

export async function saveTransaction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser()
  const id = str(fd, 'id')
  const type = str(fd, 'type') === 'in' ? 'in' : 'out'
  const amount = parseAmount(fd.get('amount'))
  const cat = str(fd, 'category')
  const date = str(fd, 'date')
  const note = str(fd, 'note').slice(0, 200)
  const today = todayYmd()
  if (amount <= 0) return { error: 'Masukkan jumlahnya dulu.' }
  if (!(type === 'out' ? OUT_KEYS : IN_KEYS).includes(cat)) return { error: 'Pilih kategori.' }
  if (!isYmd(date)) return { error: 'Tanggal tidak valid.' }
  if (date > today) return { error: 'Tanggal tidak boleh lewat dari hari ini.' }

  if (id) {
    const res = await db.update(schema.transactions)
      .set({ type, amount, category: cat, date, note })
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, user.id), eq(schema.transactions.source, 'manual')))
      .returning({ id: schema.transactions.id })
    if (!res.length) return { error: 'Transaksi tidak ditemukan atau tidak bisa diubah dari sini.' }
  } else {
    await db.insert(schema.transactions).values({ userId: user.id, type, amount, category: cat, date, note })
  }
  done(str(fd, 'back') === 'transaksi' ? '/transaksi' : '/')
}

export async function deleteTransaction(fd: FormData) {
  const user = await requireUser()
  const id = str(fd, 'id')
  await db.delete(schema.transactions).where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, user.id), eq(schema.transactions.source, 'manual')))
  revalidatePath('/', 'layout')
}

// ---------- Pengeluaran rutin

async function payItem(userId: string, itemId: string, amountOverride?: number) {
  const [item] = await db.select().from(schema.recurringItems).where(and(eq(schema.recurringItems.id, itemId), eq(schema.recurringItems.userId, userId)))
  if (!item) return
  const today = todayYmd()
  const period = periodOf(today, await getRules(userId))
  const amount = amountOverride && amountOverride > 0 ? amountOverride : item.amount
  await db.transaction(async (t) => {
    const exists = await t.select().from(schema.recurringPayments).where(and(eq(schema.recurringPayments.itemId, item.id), eq(schema.recurringPayments.periodStart, period.start)))
    if (exists.length) return
    if (item.kind === 'saving' && item.potId) {
      const [s] = await t.insert(schema.savingTxs).values({ userId, potId: item.potId, amount, date: today, note: item.name }).returning()
      await t.insert(schema.recurringPayments).values({ userId, itemId: item.id, periodStart: period.start, amount, savingTxId: s.id })
    } else {
      const [x] = await t.insert(schema.transactions).values({ userId, type: 'out', amount, category: item.category, date: today, note: item.name, source: 'recurring', recurringItemId: item.id }).returning()
      await t.insert(schema.recurringPayments).values({ userId, itemId: item.id, periodStart: period.start, amount, transactionId: x.id })
    }
  })
}

export async function toggleRecurring(fd: FormData) {
  const user = await requireUser()
  const itemId = str(fd, 'itemId')
  const period = periodOf(todayYmd(), await getRules(user.id))
  const [pay] = await db.select().from(schema.recurringPayments)
    .where(and(eq(schema.recurringPayments.itemId, itemId), eq(schema.recurringPayments.userId, user.id), eq(schema.recurringPayments.periodStart, period.start)))
  if (pay) {
    await db.transaction(async (t) => {
      await t.delete(schema.recurringPayments).where(eq(schema.recurringPayments.id, pay.id))
      if (pay.transactionId) await t.delete(schema.transactions).where(eq(schema.transactions.id, pay.transactionId))
      if (pay.savingTxId) await t.delete(schema.savingTxs).where(eq(schema.savingTxs.id, pay.savingTxId))
    })
  } else {
    await payItem(user.id, itemId, parseAmount(fd.get('amount')))
  }
  revalidatePath('/', 'layout')
}

export async function payAllRecurring() {
  const user = await requireUser()
  const items = await db.select().from(schema.recurringItems).where(and(eq(schema.recurringItems.userId, user.id), eq(schema.recurringItems.active, true), eq(schema.recurringItems.variable, false)))
  for (const it of items) await payItem(user.id, it.id)
  revalidatePath('/', 'layout')
}

export async function saveRecurringItem(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser()
  const id = str(fd, 'id')
  const name = str(fd, 'name').slice(0, 80)
  const amount = parseAmount(fd.get('amount'))
  const kind = str(fd, 'kind') === 'saving' ? 'saving' : 'bill'
  const cat = kind === 'saving' ? 'tabungan' : str(fd, 'category')
  const potId = kind === 'saving' ? str(fd, 'potId') || null : null
  const dueRaw = Number(fd.get('dueDay'))
  const dueDay = dueRaw >= 1 && dueRaw <= 31 ? dueRaw : null
  const variable = fd.get('variable') === 'on'
  if (!name) return { error: 'Isi nama pengeluaran rutin.' }
  if (amount <= 0) return { error: 'Isi perkiraan jumlahnya.' }
  if (kind === 'bill' && !OUT_KEYS.includes(cat)) return { error: 'Pilih kategori.' }
  if (kind === 'saving' && !potId) return { error: 'Pilih tabungan tujuan, atau buat tabungan dulu.' }
  const values = { name, amount, category: cat, kind: kind as 'bill' | 'saving', potId, dueDay, variable }
  if (id) await db.update(schema.recurringItems).set(values).where(and(eq(schema.recurringItems.id, id), eq(schema.recurringItems.userId, user.id)))
  else await db.insert(schema.recurringItems).values({ ...values, userId: user.id })
  done('/rutin')
}

export async function deleteRecurringItem(fd: FormData) {
  const user = await requireUser()
  await db.update(schema.recurringItems).set({ active: false }).where(and(eq(schema.recurringItems.id, str(fd, 'id')), eq(schema.recurringItems.userId, user.id)))
  done('/rutin')
}

// ---------- Tabungan

export async function savePot(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser()
  const id = str(fd, 'id')
  const name = str(fd, 'name').slice(0, 60)
  const target = parseAmount(fd.get('target'))
  const deadline = str(fd, 'deadline')
  const color = Object.keys(POT_COLORS).includes(str(fd, 'color')) ? str(fd, 'color') : 'green'
  if (!name) return { error: 'Isi nama tabungan.' }
  const values = { name, target, deadline: isYmd(deadline) ? deadline : null, color }
  if (id) {
    await db.update(schema.pots).set(values).where(and(eq(schema.pots.id, id), eq(schema.pots.userId, user.id)))
    done(`/tabungan?pot=${id}`)
  }
  const [pot] = await db.insert(schema.pots).values({ ...values, userId: user.id }).returning()
  done(`/tabungan?pot=${pot.id}`)
}

export async function archivePot(fd: FormData) {
  const user = await requireUser()
  await db.update(schema.pots).set({ archived: true }).where(and(eq(schema.pots.id, str(fd, 'id')), eq(schema.pots.userId, user.id)))
  done('/tabungan')
}

export async function moveSaving(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser()
  const potId = str(fd, 'potId')
  const mode = str(fd, 'mode') === 'out' ? 'out' : 'in'
  const amount = parseAmount(fd.get('amount'))
  const date = str(fd, 'date')
  const note = str(fd, 'note').slice(0, 120)
  const counted = mode === 'out' && fd.get('counted') === 'on'
  if (amount <= 0) return { error: 'Masukkan jumlahnya dulu.' }
  if (!isYmd(date) || date > todayYmd()) return { error: 'Tanggal tidak boleh lewat dari hari ini.' }
  const [pot] = await db.select().from(schema.pots).where(and(eq(schema.pots.id, potId), eq(schema.pots.userId, user.id)))
  if (!pot) return { error: 'Tabungan tidak ditemukan.' }
  await db.transaction(async (t) => {
    let transactionId: string | null = null
    if (counted) {
      const [x] = await t.insert(schema.transactions).values({ userId: user.id, type: 'out', amount, category: 'lainnya', date, note: note || `Dari tabungan ${pot.name}`, source: 'saving' }).returning()
      transactionId = x.id
    }
    await t.insert(schema.savingTxs).values({ userId: user.id, potId, amount: mode === 'in' ? amount : -amount, date, note, countedAsExpense: counted, transactionId })
  })
  done(`/tabungan?pot=${potId}`)
}

export async function deleteSavingTx(fd: FormData) {
  const user = await requireUser()
  const [s] = await db.select().from(schema.savingTxs).where(and(eq(schema.savingTxs.id, str(fd, 'id')), eq(schema.savingTxs.userId, user.id)))
  if (!s) return
  await db.transaction(async (t) => {
    await t.delete(schema.recurringPayments).where(eq(schema.recurringPayments.savingTxId, s.id))
    await t.delete(schema.savingTxs).where(eq(schema.savingTxs.id, s.id))
    if (s.transactionId) await t.delete(schema.transactions).where(eq(schema.transactions.id, s.transactionId))
  })
  revalidatePath('/', 'layout')
}

// ---------- Pengaturan gajian

export async function savePayday(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser()
  const day = Number(fd.get('day'))
  const weekendShift = fd.get('weekendShift') === 'on'
  const apply = str(fd, 'apply') === 'now' ? 'now' : 'next'
  const salary = parseAmount(fd.get('salary'))
  if (!(day >= 1 && day <= 31)) return { error: 'Pilih tanggal 1 sampai 31.' }
  const rules = await getRules(user.id)
  const current = periodOf(todayYmd(), rules)
  const effectiveFrom = apply === 'now' ? current.start : addDays(current.end, 1)
  const existing = await db.select().from(schema.paydayRules).where(eq(schema.paydayRules.userId, user.id)).orderBy(desc(schema.paydayRules.effectiveFrom))
  await db.transaction(async (t) => {
    // Aturan yang mulai berlaku di atau setelah tanggal ini digantikan
    await t.delete(schema.paydayRules).where(and(eq(schema.paydayRules.userId, user.id), gte(schema.paydayRules.effectiveFrom, effectiveFrom)))
    const remaining = existing.filter((r) => r.effectiveFrom < effectiveFrom)
    await t.insert(schema.paydayRules).values({ userId: user.id, day, weekendShift, effectiveFrom: remaining.length ? effectiveFrom : '2000-01-01' })
    await t.update(schema.users).set({ salary }).where(eq(schema.users.id, user.id))
  })
  done('/pengaturan')
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser()
  const name = str(fd, 'name').slice(0, 60)
  if (!name) return { error: 'Nama tidak boleh kosong.' }
  await db.update(schema.users).set({ name }).where(eq(schema.users.id, user.id))
  done('/pengaturan')
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser()
  const current = String(fd.get('current') ?? '')
  const next = String(fd.get('next') ?? '')
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: 'Kata sandi sekarang salah.' }
  const p = passwordProblem(next)
  if (p) return { error: p }
  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(next, 11) }).where(eq(schema.users.id, user.id))
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id))
  await createSession(user.id)
  done('/pengaturan?ok=sandi')
}
