'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { saveRecurringItem, deleteRecurringItem } from '@/lib/actions'
import { OUT_CATEGORIES, ICONS } from '@/lib/categories'
import { IconBack } from '@/components/icons'
import { SubmitButton } from '@/components/SubmitButton'

type Item = { id: string; name: string; amount: number; category: string; variable: boolean; dueDay: number | null; kind: 'bill' | 'saving'; potId: string | null }

export default function RecurringForm({ item, pots }: { item?: Item; pots: { id: string; name: string }[] }) {
  const [state, action] = useActionState(saveRecurringItem, undefined)
  const [kind, setKind] = useState<'bill' | 'saving'>(item?.kind ?? 'bill')
  const [cat, setCat] = useState(item?.category && item.category !== 'tabungan' ? item.category : 'rumah')
  return (
    <main className="main">
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <input type="hidden" name="id" value={item?.id ?? ''} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="category" value={cat} />
        <div className="titlebar">
          <Link className="gbtn" href="/rutin" aria-label="Kembali ke Rutin"><IconBack /></Link>
          <h1 className="hl">{item ? 'Ubah rutin' : 'Rutin baru'}</h1>
          <span />
        </div>
        <div className="seg" role="radiogroup" aria-label="Jenis">
          <button type="button" role="radio" aria-checked={kind === 'bill'} aria-pressed={kind === 'bill'} onClick={() => setKind('bill')}>Tagihan</button>
          <button type="button" role="radio" aria-checked={kind === 'saving'} aria-pressed={kind === 'saving'} onClick={() => setKind('saving')}>Setor tabungan</button>
        </div>
        <section>
          <div className="grp">
            <label className="cell"><span className="bd label-w">Nama</span><input className="field left" name="name" required defaultValue={item?.name} placeholder={kind === 'bill' ? 'mis. Bayar kos' : 'mis. Dana darurat'} /></label>
            <label className="cell ln0"><span className="bd label-w">Jumlah</span><input className="field left" name="amount" inputMode="numeric" required defaultValue={item?.amount} placeholder="Rp 0" /></label>
            {kind === 'bill' ? (<>
              <label className="cell ln0"><span className="bd grow">Jumlah berubah tiap bulan</span><input type="checkbox" className="switch" name="variable" defaultChecked={item?.variable} /></label>
              <label className="cell ln0"><span className="bd grow">Jatuh tempo</span>
                <select className="field" name="dueDay" defaultValue={item?.dueDay ?? ''} style={{ flex: 'none' }}>
                  <option value="">Tidak ada</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>Tanggal {i + 1}</option>)}
                </select>
              </label>
            </>) : (
              <label className="cell ln0"><span className="bd grow">Ke tabungan</span>
                <select className="field" name="potId" defaultValue={item?.potId ?? pots[0]?.id ?? ''} style={{ flex: 'none' }}>
                  {pots.length === 0 && <option value="">Belum ada tabungan</option>}
                  {pots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
          </div>
          <p className="fn ftr" style={{ margin: 0 }}>
            {kind === 'bill' ? 'Untuk tagihan yang berubah seperti token listrik, jumlahnya diisi saat menandai dibayar.' : pots.length === 0 ? <>Buat tabungan dulu di <Link href="/tabungan/baru">halaman Tabungan</Link>.</> : 'Saat ditandai, uangnya masuk ke tabungan ini dan mengurangi sisa uang periode ini.'}
          </p>
        </section>
        {kind === 'bill' && (
          <section>
            <div className="hdr"><h2 className="t3">Kategori</h2></div>
            <div className="cats" role="radiogroup" aria-label="Kategori">
              {OUT_CATEGORIES.map((c) => (
                <button key={c.key} type="button" className="cat" role="radio" aria-checked={cat === c.key} onClick={() => setCat(c.key)} style={{ ['--c' as string]: c.color }}>
                  <span className="tile" style={{ background: c.color }}><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[c.icon]} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  {c.label}
                </button>
              ))}
            </div>
          </section>
        )}
        {state?.error && <div className="fn alert" role="alert">{state.error}</div>}
        <SubmitButton pendingText="Menyimpan…">{item ? 'Simpan perubahan' : 'Tambah ke rutin'}</SubmitButton>
      </form>
      {item && (
        <form action={deleteRecurringItem}>
          <input type="hidden" name="id" value={item.id} />
          <button className="capsule destructive block">Hapus dari rutin</button>
          <p className="fn ftr" style={{ margin: 0 }}>Catatan yang sudah dibayar sebelumnya tetap tersimpan di laporan.</p>
        </form>
      )}
    </main>
  )
}
