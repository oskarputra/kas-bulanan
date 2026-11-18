import { test } from 'node:test'
import assert from 'node:assert/strict'
import { periodOf, paydayFor, lastPeriods, type Rule } from '../src/lib/period'

const r25: Rule[] = [{ day: 25, weekendShift: true, effectiveFrom: '2000-01-01' }]

test('periode biasa tanggal 25', () => {
  // 25 Nov 2026 = Rabu, 25 Okt 2026 = Minggu -> maju ke Jumat 23 Okt
  assert.deepEqual(periodOf('2026-11-18', r25), { start: '2026-10-23', end: '2026-11-24' })
  assert.deepEqual(periodOf('2026-11-25', r25), { start: '2026-11-25', end: '2026-12-24' })
})

test('tanpa geser akhir pekan', () => {
  const r: Rule[] = [{ day: 25, weekendShift: false, effectiveFrom: '2000-01-01' }]
  assert.deepEqual(periodOf('2026-11-18', r), { start: '2026-10-25', end: '2026-11-24' })
})

test('tanggal 31 di bulan pendek jatuh ke hari terakhir', () => {
  const r: Rule[] = [{ day: 31, weekendShift: false, effectiveFrom: '2000-01-01' }]
  assert.equal(paydayFor(2026 * 12 + 1, r[0]), '2026-02-28')
  assert.deepEqual(periodOf('2026-03-10', r), { start: '2026-02-28', end: '2026-03-30' })
})

test('tanggal 1 jatuh Sabtu bergeser ke bulan sebelumnya', () => {
  // 1 Agustus 2026 = Sabtu -> 31 Juli
  const r: Rule[] = [{ day: 1, weekendShift: true, effectiveFrom: '2000-01-01' }]
  assert.equal(paydayFor(2026 * 12 + 7, r[0]), '2026-07-31')
  assert.deepEqual(periodOf('2026-07-31', r), { start: '2026-07-31', end: '2026-08-31' })
  assert.deepEqual(periodOf('2026-07-30', r).end, '2026-07-30')
})

test('ganti aturan mulai periode berikutnya tidak tumpang tindih', () => {
  const rules: Rule[] = [
    { day: 25, weekendShift: false, effectiveFrom: '2000-01-01' },
    { day: 10, weekendShift: false, effectiveFrom: '2026-11-25' },
  ]
  assert.deepEqual(periodOf('2026-11-18', rules), { start: '2026-10-25', end: '2026-11-24' })
  assert.deepEqual(periodOf('2026-11-30', rules), { start: '2026-11-25', end: '2026-12-09' })
  assert.deepEqual(periodOf('2026-12-15', rules), { start: '2026-12-10', end: '2027-01-09' })
})

test('enam periode terakhir berurutan', () => {
  const ps = lastPeriods(periodOf('2026-11-18', r25), 6, r25)
  assert.equal(ps.length, 6)
  for (let i = 1; i < ps.length; i++) {
    const prevEnd = new Date(ps[i - 1].end); prevEnd.setUTCDate(prevEnd.getUTCDate() + 1)
    assert.equal(prevEnd.toISOString().slice(0, 10), ps[i].start)
  }
})
