import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/auth'
import { getContext, potBalances, totalsFor } from '@/lib/data'
import { fmtShort, MONTHS_SHORT, parts, daysBetween } from '@/lib/dates'
import { rp, rpShort } from '@/lib/money'
import { POT_COLORS } from '@/lib/categories'
import { deleteSavingTx } from '@/lib/actions'
import { IconPlus, IconUp, IconDown } from '@/components/icons'

export const metadata = { title: 'Tabungan' }

export default async function Page({ searchParams }: { searchParams: Promise<{ pot?: string }> }) {
  const user = await requireUser()
  const sp = await searchParams
  const { period, today } = await getContext(user)
  const [pots, totals] = await Promise.all([potBalances(user.id), totalsFor(user.id, period)])
  const total = pots.reduce((s, p) => s + p.balance, 0)
  const sel = pots.find((p) => p.id === sp.pot) ?? pots[0]
  const history = sel
    ? await db.select().from(schema.savingTxs).where(and(eq(schema.savingTxs.potId, sel.id), eq(schema.savingTxs.userId, user.id))).orderBy(desc(schema.savingTxs.date), desc(schema.savingTxs.createdAt)).limit(30)
    : []
  // Perkiraan tercapai dari rata-rata setoran bersih 3 bulan terakhir
  let eta = '–'
  if (sel && sel.target > 0) {
    if (sel.balance >= sel.target) eta = 'Tercapai'
    else {
      const recent = history.filter((h) => daysBetween(h.date, today) <= 92).reduce((s, h) => s + h.amount, 0)
      const perMonth = recent / 3
      if (perMonth > 0) {
        const months = Math.ceil((sel.target - sel.balance) / perMonth)
        const { y, m } = parts(today)
        const k = y * 12 + m + months
        eta = `${MONTHS_SHORT[k % 12]} ${Math.floor(k / 12)}`
      } else eta = 'Belum ada setoran'
    }
  }
  const net = totals.deposits - totals.withdrawals

  return (
    <main className="main">
      <div className="topbar"><Link className="gbtn" href="/tabungan/baru" aria-label="Buat tabungan baru"><IconPlus /></Link></div>
      <div style={{ marginTop: -6 }}>
        <h1 className="lt">Tabungan</h1>
        <div className="sh sec">Total di {pots.length} tabungan</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: -8 }}>
        <div className="lt">{rp(total)}</div>
        {net !== 0 && <span className="c1 strong" style={{ padding: '4px 10px', borderRadius: 12, background: net > 0 ? '#E1F3E8' : '#FDE4E4', color: net > 0 ? 'var(--tint)' : 'var(--danger)' }}>{net > 0 ? '+' : ''}{rpShort(net)} periode ini</span>}
      </div>

      {pots.length === 0 ? (
        <div className="grp"><div className="cell" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 16 }}>
          <div className="bd">Buat tabungan untuk dana darurat, liburan, atau barang yang ingin dibeli.</div>
          <Link href="/tabungan/baru" className="capsule fill small">Buat tabungan</Link>
        </div></div>
      ) : (
        <>
          <nav className="rail" aria-label="Pilih tabungan">
            {pots.map((p) => {
              const c = POT_COLORS[p.color] ?? POT_COLORS.green
              const pct = p.target > 0 ? Math.min(100, Math.round((p.balance / p.target) * 100)) : 0
              return (
                <Link key={p.id} href={`/tabungan?pot=${p.id}`} className="potcard" aria-current={p.id === sel?.id ? 'true' : undefined} style={{ background: c.bg, color: c.fg }}>
                  <span className="c1 strong" style={{ alignSelf: 'flex-end' }}>{p.target > 0 ? `${pct}% dari ${rpShort(p.target)}` : 'Tanpa target'}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="sh strong">{p.name}</span><span className="t2">{rpShort(p.balance)}</span></span>
                  <span style={{ display: 'block', height: 6, borderRadius: 3, background: c.track }}><span style={{ display: 'block', height: 6, borderRadius: 3, width: `${pct}%`, background: c.bar }} /></span>
                </Link>
              )
            })}
          </nav>
          {sel && <>
            <div className="grp" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <div style={{ padding: '12px 14px' }}><div className="fn sec">Target</div><div className="hl">{sel.target ? rpShort(sel.target) : '–'}</div></div>
              <div style={{ padding: '12px 14px', borderLeft: '1px solid var(--sep)' }}><div className="fn sec">Kurang</div><div className="hl">{sel.target ? rpShort(Math.max(0, sel.target - sel.balance)) : '–'}</div></div>
              <div style={{ padding: '12px 14px', borderLeft: '1px solid var(--sep)' }}><div className="fn sec">{sel.deadline ? 'Tenggat' : 'Perkiraan'}</div><div className="hl">{sel.deadline ? fmtShort(sel.deadline) : eta}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Link href={`/tabungan/${sel.id}/pindah?mode=in`} className="capsule fill"><IconUp />Setor</Link>
              <Link href={`/tabungan/${sel.id}/pindah?mode=out`} className="capsule tinted"><IconDown />Tarik</Link>
            </div>
            <section>
              <div className="hdr"><h2 className="t3">Riwayat</h2><Link className="sh" href={`/tabungan/${sel.id}/ubah`}>Ubah {sel.name}</Link></div>
              <div className="grp">
                {history.length === 0 && <div className="cell"><span className="bd sec">Belum ada setoran.</span></div>}
                {history.map((h, i) => (
                  <div key={h.id} className={'cell' + (i ? ' ln' : ' first')}>
                    <span className="sq" style={{ background: h.amount > 0 ? '#248A3D' : '#6C6C70' }}>{h.amount > 0 ? <IconUp size={16} /> : <IconDown size={16} />}</span>
                    <div className="grow"><div className="bd ellipsis">{h.note || (h.amount > 0 ? 'Setor' : 'Tarik')}</div><div className="fn sec">{fmtShort(h.date)} {parts(h.date).y}{h.countedAsExpense ? ', dicatat sebagai pengeluaran' : ''}</div></div>
                    <span className="bd strong" style={{ color: h.amount > 0 ? 'var(--tint)' : undefined }}>{h.amount > 0 ? '+' : '−'}{rp(Math.abs(h.amount))}</span>
                    <form action={deleteSavingTx}><input type="hidden" name="id" value={h.id} /><button className="gbtn" style={{ width: 32, height: 32, boxShadow: 'none', background: 'var(--fill)', color: 'var(--label-3)' }} aria-label={`Hapus catatan ${h.note || 'tabungan'} ${fmtShort(h.date)}`}>×</button></form>
                  </div>
                ))}
              </div>
              <p className="fn ftr" style={{ margin: 0 }}>Uang yang ditarik tidak masuk pengeluaran bulanan, kecuali kamu pilih &quot;Catat juga sebagai pengeluaran&quot; saat menarik.</p>
            </section>
          </>}
        </>
      )}
    </main>
  )
}
