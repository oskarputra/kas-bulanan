import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getContext, recurringStatus } from '@/lib/data'
import { fmtShort } from '@/lib/dates'
import { rp } from '@/lib/money'
import { payAllRecurring, toggleRecurring } from '@/lib/actions'
import { CatIcon, IconCheck, IconPlus, IconCalendar, IconChevron, Ring } from '@/components/icons'
import { SubmitButton } from '@/components/SubmitButton'

export const metadata = { title: 'Rutin' }

export default async function Page() {
  const user = await requireUser()
  const { today, period, rules } = await getContext(user)
  const list = await recurringStatus(user.id, period)
  const bills = list.filter((r) => r.item.kind === 'bill')
  const savings = list.filter((r) => r.item.kind === 'saving')
  const total = list.reduce((s, r) => s + (r.paid ? r.paidAmount : r.item.amount), 0)
  const paid = list.filter((r) => r.paid).reduce((s, r) => s + r.paidAmount, 0)
  const unpaid = list.filter((r) => !r.paid)
  const fixedUnpaid = unpaid.filter((r) => !r.item.variable)
  const rule = rules[rules.length - 1]

  const Row = ({ r, i }: { r: (typeof list)[number]; i: number }) => (
    <div className={'cell' + (i ? ' ln' : ' first')} style={{ paddingLeft: 6 }}>
      {r.item.variable && !r.paid ? (
        <span style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span className="check" aria-hidden="true" /></span>
      ) : (
        <form action={toggleRecurring} style={{ flex: 'none' }}>
          <input type="hidden" name="itemId" value={r.item.id} />
          <button type="submit" role="checkbox" aria-checked={r.paid} aria-label={(r.paid ? 'Batalkan tanda dibayar: ' : 'Tandai dibayar: ') + r.item.name} style={{ width: 44, height: 44, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <span className={'check' + (r.paid ? ' on' : '')}>{r.paid && <IconCheck />}</span>
          </button>
        </form>
      )}
      <CatIcon cat={r.item.category} />
      <Link href={`/rutin/${r.item.id}`} className="grow" style={{ color: 'inherit' }}>
        <div className="bd ellipsis" style={{ color: r.paid ? 'var(--label-3)' : undefined }}>{r.item.name}</div>
        <div className="fn" style={{ color: !r.paid && r.dueDate && r.dueDate <= today ? 'var(--danger)' : 'var(--label-3)', fontWeight: !r.paid && r.dueDate && r.dueDate <= today ? 600 : 400 }}>
          {r.paid ? `Dibayar ${fmtShort(String(r.paidAt?.toISOString()).slice(0, 10))}` : r.item.variable ? 'Jumlah berubah, isi saat bayar' : r.dueDate ? `Jatuh tempo ${fmtShort(r.dueDate)}` : r.potName ? `Ke ${r.potName}` : 'Jumlah tetap'}
        </div>
      </Link>
      {r.item.variable && !r.paid ? (
        <form action={toggleRecurring} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="hidden" name="itemId" value={r.item.id} />
          <label className="sr" htmlFor={`amt-${r.item.id}`}>Jumlah {r.item.name}</label>
          <input id={`amt-${r.item.id}`} name="amount" inputMode="numeric" defaultValue={r.item.amount} className="field" style={{ width: 96, flex: 'none', background: 'var(--fill)', borderRadius: 8, height: 34, padding: '0 8px' }} />
          <button className="capsule tinted small">Bayar</button>
        </form>
      ) : (
        <span className="bd strong">{rp(r.paid ? r.paidAmount : r.item.amount)}</span>
      )}
    </div>
  )

  return (
    <main className="main">
      <div className="topbar"><Link className="gbtn" href="/rutin/baru" aria-label="Tambah pengeluaran rutin"><IconPlus /></Link></div>
      <div style={{ marginTop: -6 }}>
        <h1 className="lt">Rutin</h1>
        <div className="sh sec">Muncul otomatis tiap gajian</div>
      </div>

      <section className="hero" style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Ring value={total ? paid / total : 0} size={96} stroke={11} color="#9BD3B5" label={`${total ? Math.round((paid / total) * 100) : 0} persen pengeluaran rutin sudah dibayar`}>
          <div className="t3" style={{ fontWeight: 700 }}>{total ? Math.round((paid / total) * 100) : 0}%</div><div className="c2 muted">dibayar</div>
        </Ring>
        <div className="grow">
          <div className="fn muted">Periode {fmtShort(period.start)} – {fmtShort(period.end)}</div>
          <div className="t2" style={{ marginTop: 2 }}>{rp(paid)}</div>
          <div className="fn" style={{ color: '#DCEBE3' }}>dari {rp(total)}</div>
          {unpaid.length > 0 && <div style={{ marginTop: 8 }}><span className="chip gold">{unpaid.length} belum dibayar, {rp(unpaid.reduce((s, r) => s + r.item.amount, 0))}</span></div>}
        </div>
      </section>

      {list.length === 0 ? (
        <div className="grp"><div className="cell" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 16 }}>
          <div className="bd">Belum ada pengeluaran rutin. Tambahkan kos, listrik, transportasi, atau setoran tabungan bulanan.</div>
          <Link href="/rutin/baru" className="capsule fill small">Tambah pengeluaran rutin</Link>
        </div></div>
      ) : (
        <>
          {bills.length > 0 && <section>
            <div className="hdr"><h2 className="t3">Tagihan dan kebutuhan</h2></div>
            <div className="grp">{bills.map((r, i) => <Row key={r.item.id} r={r} i={i} />)}</div>
            <p className="fn ftr" style={{ margin: 0 }}>Ketuk lingkaran kalau sudah dibayar, langsung tercatat sebagai pengeluaran. Ketuk nama untuk mengubah.</p>
          </section>}
          {savings.length > 0 && <section>
            <div className="hdr"><h2 className="t3">Langsung ke tabungan</h2></div>
            <div className="grp">{savings.map((r, i) => <Row key={r.item.id} r={r} i={i} />)}</div>
          </section>}
        </>
      )}

      <div className="grp">
        <Link href="/pengaturan/gajian" className="cell">
          <span className="sq" style={{ background: 'var(--tint)' }}><IconCalendar size={18} /></span>
          <span className="bd grow">Tanggal gajian</span>
          <span className="bd sec">Tanggal {rule.day}</span><IconChevron />
        </Link>
      </div>

      {fixedUnpaid.length > 0 && (
        <form action={payAllRecurring}>
          <SubmitButton pendingText="Mencatat…">Tandai {fixedUnpaid.length} sisanya dibayar</SubmitButton>
        </form>
      )}
    </main>
  )
}
