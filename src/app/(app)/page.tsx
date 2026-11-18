import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { dashboard } from '@/lib/data'
import { rp, rpShort } from '@/lib/money'
import { fmtShort, fmtDayShort, addDays } from '@/lib/dates'
import { category } from '@/lib/categories'
import { toggleRecurring } from '@/lib/actions'
import { CatIcon, IconCalendar, IconGear, IconPlus, IconSpark, Ring } from '@/components/icons'

export const metadata = { title: 'Beranda' }

export default async function Home() {
  const user = await requireUser()
  const d = await dashboard(user)
  const { totals } = d
  const pct = (n: number) => (d.income > 0 ? Math.max(0, (n / d.income) * 100) : 0)
  const segs = [
    { label: 'Rutin', value: totals.outRecurring, color: '#9BD3B5' },
    { label: 'Harian', value: totals.outDaily, color: '#5FA083' },
    { label: 'Tabung', value: Math.max(0, totals.deposits - totals.withdrawals), color: '#F2CC6B' },
  ]
  const sisaPct = Math.max(0, 100 - segs.reduce((s, x) => s + pct(x.value), 0))
  const today = d.week[d.week.length - 1]?.total ?? 0
  const yesterday = d.week[d.week.length - 2]?.total ?? 0
  const weekMax = Math.max(1, ...d.week.map((w) => w.total))
  const recPct = d.recCount ? d.recPaidCount / d.recCount : 0
  const groups = new Map<string, typeof d.recent>()
  for (const t of d.recent) groups.set(t.date, [...(groups.get(t.date) ?? []), t])
  const dayLabel = (s: string) => (s === d.today ? 'Hari ini' : s === addDays(d.today, -1) ? 'Kemarin' : fmtDayShort(s))
  const firstName = user.name.split(' ')[0]

  return (
    <main className="main wide">
      <div className="topbar">
        <Link className="gbtn hide-desktop" href="/pengaturan" aria-label="Akun dan pengaturan"><IconGear /></Link>
        <Link className="gbtn" href="/pengaturan/gajian" aria-label="Atur tanggal gajian"><IconCalendar /></Link>
        <Link className="gbtn tint hide-desktop" href="/catat" aria-label="Catat pengeluaran"><IconPlus /></Link>
      </div>
      <div style={{ marginTop: -6 }}>
        <h1 className="lt">Halo, {firstName}</h1>
        <div className="sh sec">Periode {fmtShort(d.period.start)} – {fmtShort(d.period.end)}</div>
      </div>

      <div className="cols two">
        <section className="hero" aria-label="Ringkasan periode">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="grow">
              <div className="sh muted strong">Bisa dipakai sampai gajian</div>
              <div className="lt" style={{ marginTop: 2, color: d.spendable < 0 ? '#FFB4A8' : undefined }}>{rp(d.spendable)}</div>
              <div className="fn" style={{ color: '#DCEBE3', marginTop: 2 }}>
                {d.spendable > 0 ? `Sekitar ${rp(d.perDay)} per hari` : 'Pengeluaran sudah melewati gaji periode ini'}
              </div>
            </div>
            <Ring value={d.elapsed / d.totalDays} label={`Hari ke-${d.elapsed} dari ${d.totalDays}, ${d.daysLeft} hari lagi gajian`}>
              <div className="t2" style={{ lineHeight: '24px' }}>{d.daysLeft}</div><div className="c2 muted">hari lagi</div>
            </Ring>
          </div>
          {d.unpaid.length > 0 && <div><span className="chip gold">{d.unpaid.length} tagihan belum dibayar, {rpShort(d.unpaidSum)}</span></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 3, height: 8 }} role="img" aria-label={`Pembagian ${d.incomeIsEstimate ? 'gaji' : 'pemasukan'} ${rp(d.income)}`}>
              {segs.map((s) => pct(s.value) > 0 && <div key={s.label} style={{ width: `${pct(s.value)}%`, background: s.color, borderRadius: 3 }} />)}
              {sisaPct > 0 && <div style={{ width: `${sisaPct}%`, background: 'rgba(255,255,255,.2)', borderRadius: 3 }} />}
            </div>
            <div className="c1" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, color: '#DCEBE3', fontWeight: 600 }}>
              {segs.map((s) => <span key={s.label}>{s.label} {rpShort(s.value)}</span>)}
              <span>Sisa {rpShort(d.sisa)}</span>
            </div>
            {d.incomeIsEstimate && <div className="c1 muted">{d.income > 0 ? `Pakai gaji di pengaturan, ${rp(d.income)}. Catat pemasukan gaji supaya lebih tepat.` : 'Isi gaji bulanan di pengaturan supaya sisa uang bisa dihitung.'}</div>}
          </div>
          {d.insight && <div className="insight"><IconSpark /><div className="fn">{d.insight}</div></div>}
        </section>

        <div className="widgets">
          <Link href="/rutin" className="grp widget">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="sh strong">Rutin</span><span className="c1 strong" style={{ color: 'var(--tint)' }}>{d.recPaidCount} dari {d.recCount}</span></div>
            <svg width="100%" height="58" viewBox="0 0 120 64" aria-hidden="true">
              <path d="M12 58 A48 48 0 0 1 108 58" fill="none" stroke="#E3EFE8" strokeWidth="12" strokeLinecap="round" />
              {recPct > 0 && <path d="M12 58 A48 48 0 0 1 108 58" fill="none" stroke="#1E6B52" strokeWidth="12" strokeLinecap="round" pathLength={100} strokeDasharray={`${recPct * 100} 100`} />}
            </svg>
            <div className="t3">{rpShort(d.recPaid)}</div><div className="c1 sec">dibayar dari {rpShort(d.recTotal)}</div>
          </Link>
          <Link href="/transaksi" className="grp widget">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="sh strong">Hari ini</span><span className="c1 strong" style={{ color: '#C93400' }}>7 hari</span></div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 58 }} role="img" aria-label={`Pengeluaran harian 7 hari terakhir, hari ini ${rp(today)}`}>
              {d.week.map((w, i) => <span key={w.date} style={{ flex: 1, height: `${Math.max(6, (w.total / weekMax) * 100)}%`, background: i === d.week.length - 1 ? '#C93400' : '#FBE3D3', borderRadius: 4 }} />)}
            </div>
            <div className="t3">{rp(today)}</div><div className="c1 sec">kemarin {rp(yesterday)}</div>
          </Link>
          <Link href="/tabungan" className="grp widget">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="sh strong">Tabungan</span><span className="c1 strong" style={{ color: '#0040DD' }}>{totals.deposits > 0 ? `+${rpShort(totals.deposits).replace('Rp ', '')}` : ''}</span></div>
            <div style={{ flex: 1 }} />
            <div className="t3">{rpShort(d.savingsTotal)}</div><div className="c1 sec">{d.potCount ? `di ${d.potCount} tabungan` : 'Belum ada tabungan'}</div>
          </Link>
          <Link href="/laporan" className="grp widget">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="sh strong">Keluar</span><span className="c1 strong" style={{ color: '#C1272D' }}>{d.income > 0 ? `${Math.round(pct(totals.out))}% gaji` : ''}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9, flex: 1 }}>
              {[['Rutin', totals.outRecurring], ['Harian', totals.outDaily]].map(([l, v]) => (
                <div key={l as string} className="c2" style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, color: 'var(--label-2)' }}>
                  <span style={{ width: 40 }}>{l}</span>
                  <span style={{ flex: 1, height: 8, borderRadius: 4, background: '#FBE0E3' }}><span style={{ display: 'block', width: `${totals.out ? ((v as number) / totals.out) * 100 : 0}%`, height: 8, borderRadius: 4, background: '#D70015' }} /></span>
                </div>
              ))}
            </div>
            <div className="t3">{rpShort(totals.out)}</div><div className="c1 sec">periode ini</div>
          </Link>
        </div>
      </div>

      <div className="cols two">
        <section>
          <div className="hdr"><h2 className="t3">Transaksi terakhir</h2><Link className="sh" href="/transaksi">Lihat semua</Link></div>
          <div className="grp">
            {d.recent.length === 0 && (
              <div className="cell" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 16 }}>
                <div className="bd">Belum ada catatan.</div>
                <Link href="/catat" className="capsule fill small">Catat pengeluaran pertama</Link>
              </div>
            )}
            {[...groups.entries()].map(([date, list]) => (
              <div key={date}>
                <div className="fn sec strong" style={{ padding: '12px 16px 2px' }}>{dayLabel(date)}</div>
                {list.map((t, i) => (
                  <Link key={t.id} href={t.source === 'manual' ? `/catat?id=${t.id}` : '/transaksi'} className={'cell' + (i === 0 ? ' first' : ' ln')}>
                    <CatIcon cat={t.category} />
                    <div className="grow"><div className="bd ellipsis">{t.note || category(t.category).label}</div><div className="fn sec">{category(t.category).label}{t.source === 'recurring' ? ', rutin' : ''}</div></div>
                    <span className="bd strong" style={{ color: t.type === 'in' ? 'var(--tint)' : undefined }}>{t.type === 'in' ? '+' : '−'}{rp(t.amount)}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="hdr"><h2 className="t3">Belum dibayar</h2><Link className="sh" href="/rutin">Semua</Link></div>
          <div className="grp">
            {d.recCount === 0 && (
              <div className="cell" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 16 }}>
                <div className="bd">Tambahkan pengeluaran rutin seperti kos, listrik, dan transportasi supaya muncul otomatis tiap gajian.</div>
                <Link href="/rutin/baru" className="capsule tinted small">Tambah pengeluaran rutin</Link>
              </div>
            )}
            {d.recCount > 0 && d.unpaid.length === 0 && <div className="cell"><span className="bd sec">Semua pengeluaran rutin periode ini sudah dibayar.</span></div>}
            {d.unpaid.map((r, i) => (
              <form key={r.item.id} action={toggleRecurring} className={'cell' + (i === 0 ? ' first' : ' ln')}>
                <input type="hidden" name="itemId" value={r.item.id} />
                <CatIcon cat={r.item.category} />
                <div className="grow"><div className="bd ellipsis">{r.item.name}</div><div className="fn" style={{ color: r.dueDate && r.dueDate <= d.today ? 'var(--danger)' : 'var(--label-3)' }}>{rp(r.item.amount)}{r.dueDate ? `, tempo ${fmtShort(r.dueDate)}` : ''}</div></div>
                {r.item.variable
                  ? <Link href="/rutin" className="capsule tinted small">Isi</Link>
                  : <button className="capsule tinted small" aria-label={`Tandai ${r.item.name} dibayar`}>Bayar</button>}
              </form>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
