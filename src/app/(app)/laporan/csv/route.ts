import { getUser } from '@/lib/auth'
import { getRules, transactionsIn } from '@/lib/data'
import { isYmd, todayYmd } from '@/lib/dates'
import { periodOf } from '@/lib/period'
import { category } from '@/lib/categories'

// Angka ditulis apa adanya; teks dilindungi dari formula injection di spreadsheet
const esc = (v: string | number) => {
  if (typeof v === 'number') return String(v)
  const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return /[",\n;']/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return new Response('Silakan masuk dulu.', { status: 401 })
  const p = new URL(req.url).searchParams.get('p')
  const period = periodOf(isYmd(p) ? p : todayYmd(), await getRules(user.id))
  const rows = await transactionsIn(user.id, period)
  const lines = [['Tanggal', 'Jenis', 'Kategori', 'Catatan', 'Jumlah', 'Sumber'].join(',')]
  for (const t of rows) lines.push([t.date, t.type === 'out' ? 'Pengeluaran' : 'Pemasukan', category(t.category).label, t.note, t.type === 'out' ? -t.amount : t.amount, t.source].map(esc).join(','))
  return new Response('﻿' + lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kas-bulanan-${period.start}-sd-${period.end}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
