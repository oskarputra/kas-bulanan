import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { report } from '@/lib/data'
import { addDays, fmtShort, isYmd, MONTHS_SHORT, parts, todayYmd } from '@/lib/dates'
import { rp, rpShort } from '@/lib/money'
import { category } from '@/lib/categories'
import { CatIcon, IconShare, IconBack } from '@/components/icons'

export const metadata = { title: 'Laporan' }

const pctId = (v: number) => (Math.round(v * 1000) / 10).toLocaleString('id-ID') + '%'

export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const user = await requireUser()
  const sp = await searchParams
  const today = todayYmd()
  const r = await report(user, isYmd(sp.p) ? sp.p : today)
  const max = Math.max(1, ...r.bars.map((b) => b.out), r.avg) * 1.08
  const diffAvg = r.totals.out - r.avg
  const diffPrev = r.totals.out - r.prevTotals.out
  const total = r.categories.reduce((s, c) => s + c.total, 0)
  let acc = 0
  const stops = r.categories.map((c) => { const p = (c.total / Math.max(1, total)) * 100; const s = `${category(c.category).color} ${acc}% ${acc + p}%`; acc += p; return s })
  const top = [...r.categories].filter((c) => c.delta !== null && c.total - c.before >= 50000).sort((a, b) => (b.total - b.before) - (a.total - a.before))[0]
  const label = (s: string) => MONTHS_SHORT[parts(addDays(s, 10)).m]
  const nextAt = addDays(r.period.end, 1)

  return (
    <main className="main">
      <div className="topbar">
        <a className="gbtn" href={`/laporan/csv?p=${r.period.start}`} aria-label="Unduh transaksi periode ini sebagai CSV" download><IconShare /></a>
      </div>
      <div style={{ marginTop: -6 }}>
        <h1 className="lt">Laporan</h1>
      </div>
      <div className="grp" style={{ display: 'flex', alignItems: 'center', padding: 6 }}>
        <Link className="gbtn" style={{ boxShadow: 'none', background: 'var(--fill)' }} href={`/laporan?p=${addDays(r.period.start, -1)}`} aria-label="Periode sebelumnya"><IconBack /></Link>
        <div className="grow" style={{ textAlign: 'center' }}><div className="hl">{fmtShort(r.period.start)} – {fmtShort(r.period.end)}</div><div className="fn sec">{r.isCurrent ? 'Periode sekarang, masih berjalan' : `Periode ${parts(r.period.start).y}`}</div></div>
        {nextAt <= today ? <Link className="gbtn" style={{ boxShadow: 'none', background: 'var(--fill)', transform: 'scaleX(-1)' }} href={`/laporan?p=${nextAt}`} aria-label="Periode berikutnya"><IconBack /></Link> : <span style={{ width: 44 }} />}
      </div>

      <section style={{ borderRadius: 26, padding: 18, background: 'linear-gradient(160deg, #F8DC93 0%, #F0C255 100%)', color: '#2E2100', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <div><div className="fn strong" style={{ color: '#5C4300' }}>Pengeluaran periode ini</div><div className="t1">{rp(r.totals.out)}</div></div>
          {r.avg > 0 && <span className="c1" style={{ fontWeight: 700, padding: '5px 10px', borderRadius: 12, whiteSpace: 'nowrap', ...(diffAvg > 0 ? { background: '#2E2100', color: '#F8DC93' } : { background: 'rgba(255,255,255,.65)', color: 'var(--tint)' }) }}>{diffAvg >= 0 ? '+' : '−'}{rpShort(Math.abs(diffAvg))} vs rata-rata periode sebelumnya</span>}
        </div>
        <div style={{ position: 'relative', height: 160 }} role="img" aria-label={'Pengeluaran 6 periode: ' + r.bars.map((b) => `${label(b.period.start)} ${rp(b.out)}`).join(', ')}>
          {r.avg > 0 && <>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(r.avg / max) * 100}%`, borderTop: '1.5px dashed rgba(46,33,0,.4)' }} />
            <div className="c2 strong" style={{ position: 'absolute', left: 0, bottom: `calc(${(r.avg / max) * 100}% + 4px)`, color: '#5C4300' }}>rata-rata {rpShort(r.avg)}</div>
          </>}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12, alignItems: 'end' }}>
            {r.bars.map((b, i) => {
              const on = i === r.bars.length - 1
              return <Link key={b.period.start} href={`/laporan?p=${b.period.start}`} aria-label={`${label(b.period.start)}: ${rp(b.out)}`} style={{ display: 'block', height: `${Math.max(2, (b.out / max) * 100)}%`, borderRadius: 8, background: on ? (r.isCurrent ? 'repeating-linear-gradient(135deg, #2E2100 0 6px, #4A3A10 6px 10px)' : '#2E2100') : 'rgba(255,255,255,.6)' }} />
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12 }} aria-hidden="true">
          {r.bars.map((b, i) => <div key={b.period.start} className="c1" style={{ textAlign: 'center', fontWeight: i === r.bars.length - 1 ? 700 : 500, color: i === r.bars.length - 1 ? '#2E2100' : '#5C4300' }}>{label(b.period.start)}</div>)}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <div className="grp" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="sh strong" style={{ color: 'var(--label-2)' }}>Keluar</div>
          <div className="t2">{rpShort(r.totals.out)}</div>
          {r.prevTotals.out > 0 && <div className="c1 strong" style={{ color: diffPrev > 0 ? 'var(--danger)' : 'var(--tint)' }}>{rpShort(Math.abs(diffPrev))} {diffPrev > 0 ? 'di atas' : 'di bawah'} periode lalu</div>}
        </div>
        <div className="grp" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="sh strong" style={{ color: 'var(--label-2)' }}>Masuk</div>
          <div className="t2">{rpShort(r.income)}</div>
          <div className="c1 strong" style={{ color: '#8A4B00' }}>{pctId(r.savingRate)} ditabung{r.incomeIsEstimate && r.income > 0 ? ', dari gaji di pengaturan' : ''}</div>
        </div>
      </div>

      <section>
        <div className="hdr"><h2 className="t3">Per kategori</h2><span className="fn sec">dibanding periode lalu</span></div>
        <div className="grp">
          {r.categories.length === 0 ? <div className="cell"><span className="bd sec">Belum ada pengeluaran di periode ini.</span></div> : <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 16 }}>
              <div role="img" aria-label={`Porsi terbesar ${category(r.categories[0].category).label} ${Math.round((r.categories[0].total / total) * 100)} persen`} style={{ width: 124, height: 124, borderRadius: 62, background: `conic-gradient(${stops.join(', ')})`, position: 'relative', flex: 'none' }}>
                <div style={{ position: 'absolute', inset: 18, borderRadius: 44, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><div className="c2 sec">Total</div><div className="hl">{rpShort(total).replace('Rp ', '')}</div></div>
              </div>
              <div className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {r.categories.slice(0, 7).map((c) => <div key={c.category} className="fn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: category(c.category).color, flex: 'none' }} /><span className="grow ellipsis">{category(c.category).label}</span><span className="strong">{Math.round((c.total / total) * 100)}%</span></div>)}
              </div>
            </div>
            {r.categories.map((c) => {
              const dir = c.delta === null ? 0 : c.delta > 0.01 ? 1 : c.delta < -0.01 ? -1 : 0
              return (
                <div key={c.category} className="cell ln">
                  <CatIcon cat={c.category} />
                  <div className="grow"><div className="bd">{category(c.category).label}</div><div className="fn sec">{rp(c.total)}, {c.count} kali</div></div>
                  <span className="c1 strong" style={{ padding: '3px 8px', borderRadius: 10, ...(dir > 0 ? { background: '#FDE4E4', color: 'var(--danger)' } : dir < 0 ? { background: '#E1F3E8', color: 'var(--tint)' } : { background: 'var(--fill)', color: 'var(--label-2)' }) }}>
                    {c.delta === null ? 'baru' : dir === 0 ? 'tetap' : `${dir > 0 ? '+' : '−'}${Math.abs(Math.round(c.delta * 100))}%`}
                  </span>
                </div>
              )
            })}
          </>}
        </div>
      </section>

      <section>
        <div className="hdr"><h2 className="t3">Yang perlu diperhatikan</h2></div>
        <div className="grp">
          {top && <div className="cell" style={{ alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14 }}><CatIcon cat={top.category} /><div className="sh"><strong>{category(top.category).label} naik {rp(top.total - top.before)}</strong> dibanding periode lalu, dari {rp(top.before)} jadi {rp(top.total)}.</div></div>}
          <div className={'cell' + (top ? ' ln' : '')} style={{ alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14 }}>
            <CatIcon cat="tabungan" />
            <div className="sh">{r.income > 0
              ? <>Kamu menabung <strong>{pctId(r.savingRate)} dari pemasukan</strong>. {r.savingRate < 0.2 ? `Untuk mencapai 20%, perlu tambah ${rp(Math.max(0, 0.2 * r.income - (r.totals.deposits - r.totals.withdrawals)))} per periode.` : 'Sudah di atas 20%, pertahankan.'}</>
              : 'Isi gaji bulanan di pengaturan supaya persentase tabungan bisa dihitung.'}</div>
          </div>
        </div>
      </section>
    </main>
  )
}
