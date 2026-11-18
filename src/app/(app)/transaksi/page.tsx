import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getRules, transactionsIn } from '@/lib/data'
import { addDays, fmtDayShort, fmtShort, isYmd, todayYmd } from '@/lib/dates'
import { periodOf } from '@/lib/period'
import { rp } from '@/lib/money'
import { category } from '@/lib/categories'
import { CatIcon, IconBack, IconPlus, IconChevron } from '@/components/icons'

export const metadata = { title: 'Semua transaksi' }

export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const user = await requireUser()
  const sp = await searchParams
  const today = todayYmd()
  const rules = await getRules(user.id)
  const at = isYmd(sp.p) && sp.p <= today ? sp.p : today
  const period = periodOf(at, rules)
  const list = await transactionsIn(user.id, period)
  const prevAt = addDays(period.start, -1)
  const nextAt = addDays(period.end, 1)
  const groups = new Map<string, typeof list>()
  for (const t of list) groups.set(t.date, [...(groups.get(t.date) ?? []), t])
  const out = list.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const inc = list.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  return (
    <main className="main">
      <div className="titlebar">
        <Link className="gbtn" href="/" aria-label="Kembali ke Beranda"><IconBack /></Link>
        <h1 className="hl">Semua transaksi</h1>
        <Link className="gbtn tint" href="/catat?back=transaksi" aria-label="Catat pengeluaran"><IconPlus /></Link>
      </div>
      <div className="grp" style={{ display: 'flex', alignItems: 'center', padding: 6 }}>
        <Link className="gbtn" style={{ boxShadow: 'none', background: 'var(--fill)' }} href={`/transaksi?p=${prevAt}`} aria-label="Periode sebelumnya"><IconBack /></Link>
        <div className="grow" style={{ textAlign: 'center' }}><div className="hl">{fmtShort(period.start)} – {fmtShort(period.end)}</div><div className="fn sec">Keluar {rp(out)}, masuk {rp(inc)}</div></div>
        {nextAt <= today
          ? <Link className="gbtn" style={{ boxShadow: 'none', background: 'var(--fill)', transform: 'scaleX(-1)' }} href={`/transaksi?p=${nextAt}`} aria-label="Periode berikutnya"><IconBack /></Link>
          : <span style={{ width: 44 }} />}
      </div>
      {list.length === 0 && <div className="grp"><div className="cell"><span className="bd sec">Belum ada transaksi di periode ini.</span></div></div>}
      {[...groups.entries()].map(([date, items]) => (
        <section key={date}>
          <div className="hdr"><h2 className="hl">{date === today ? 'Hari ini' : fmtDayShort(date)}</h2><span className="fn sec">{rp(items.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0))}</span></div>
          <div className="grp">
            {items.map((t, i) => {
              const inner = (<>
                <CatIcon cat={t.category} />
                <div className="grow"><div className="bd ellipsis">{t.note || category(t.category).label}</div><div className="fn sec">{category(t.category).label}{t.source === 'recurring' ? ', dari Rutin' : t.source === 'saving' ? ', dari Tabungan' : ''}</div></div>
                <span className="bd strong" style={{ color: t.type === 'in' ? 'var(--tint)' : undefined }}>{t.type === 'in' ? '+' : '−'}{rp(t.amount)}</span>
              </>)
              return t.source === 'manual'
                ? <Link key={t.id} href={`/catat?id=${t.id}&back=transaksi`} className={'cell' + (i ? ' ln' : ' first')}>{inner}<IconChevron /></Link>
                : <div key={t.id} className={'cell' + (i ? ' ln' : ' first')}>{inner}</div>
            })}
          </div>
        </section>
      ))}
      <p className="fn ftr" style={{ margin: 0 }}>Catatan dari Rutin dan Tabungan diubah lewat halaman masing-masing.</p>
    </main>
  )
}
