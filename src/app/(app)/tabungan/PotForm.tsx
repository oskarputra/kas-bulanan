'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { savePot, archivePot } from '@/lib/actions'
import { POT_COLORS } from '@/lib/categories'
import { IconBack, IconCheck } from '@/components/icons'
import { SubmitButton } from '@/components/SubmitButton'

const NAMES: Record<string, string> = { green: 'Hijau', blue: 'Biru', gold: 'Kuning', purple: 'Ungu', red: 'Merah' }

export default function PotForm({ pot }: { pot?: { id: string; name: string; target: number; deadline: string | null; color: string } }) {
  const [state, action] = useActionState(savePot, undefined)
  const [color, setColor] = useState(pot?.color ?? 'green')
  const back = pot ? `/tabungan?pot=${pot.id}` : '/tabungan'
  return (
    <main className="main">
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <input type="hidden" name="id" value={pot?.id ?? ''} />
        <input type="hidden" name="color" value={color} />
        <div className="titlebar">
          <Link className="gbtn" href={back} aria-label="Kembali"><IconBack /></Link>
          <h1 className="hl">{pot ? 'Ubah tabungan' : 'Tabungan baru'}</h1><span />
        </div>
        <div className="potcard" style={{ width: '100%', background: POT_COLORS[color].bg, color: POT_COLORS[color].fg }} aria-hidden="true">
          <span className="c1 strong" style={{ alignSelf: 'flex-end' }}>Pratinjau</span>
          <span className="t2">{pot?.name || 'Nama tabungan'}</span>
          <span style={{ display: 'block', height: 6, borderRadius: 3, background: POT_COLORS[color].track }} />
        </div>
        <div className="grp">
          <label className="cell"><span className="bd label-w">Nama</span><input className="field left" name="name" required defaultValue={pot?.name} placeholder="mis. Dana darurat" /></label>
          <label className="cell ln0"><span className="bd label-w">Target</span><input className="field left" name="target" inputMode="numeric" defaultValue={pot?.target || ''} placeholder="Opsional" /></label>
          <label className="cell ln0"><span className="bd grow">Tenggat</span><input type="date" name="deadline" defaultValue={pot?.deadline ?? ''} style={{ height: 36, border: 'none', borderRadius: 8, background: 'var(--fill)', padding: '0 10px' }} /></label>
        </div>
        <section>
          <div className="hdr"><h2 className="t3">Warna kartu</h2></div>
          <div role="radiogroup" aria-label="Warna kartu" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(POT_COLORS).map(([k, c]) => (
              <button key={k} type="button" role="radio" aria-checked={color === k} aria-label={NAMES[k]} onClick={() => setColor(k)} style={{ width: 48, height: 48, borderRadius: 24, border: 'none', background: c.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: color === k ? '0 0 0 3px var(--bg), 0 0 0 5.5px var(--tint)' : 'none' }}>
                {color === k && <IconCheck size={18} color={c.fg} />}
              </button>
            ))}
          </div>
        </section>
        {state?.error && <div className="fn alert" role="alert">{state.error}</div>}
        <SubmitButton pendingText="Menyimpan…">{pot ? 'Simpan perubahan' : 'Buat tabungan'}</SubmitButton>
      </form>
      {pot && (
        <form action={archivePot}>
          <input type="hidden" name="id" value={pot.id} />
          <button className="capsule destructive block">Arsipkan tabungan</button>
          <p className="fn ftr" style={{ margin: 0 }}>Tabungan yang diarsipkan disembunyikan, riwayatnya tetap tersimpan.</p>
        </form>
      )}
    </main>
  )
}
