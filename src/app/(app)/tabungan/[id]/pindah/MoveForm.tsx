'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { moveSaving } from '@/lib/actions'
import { addDays } from '@/lib/dates'
import { IconBack } from '@/components/icons'
import { SubmitButton } from '@/components/SubmitButton'

export default function MoveForm({ potId, potName, mode: initial, today }: { potId: string; potName: string; mode: 'in' | 'out'; today: string }) {
  const [state, action] = useActionState(moveSaving, undefined)
  const [mode, setMode] = useState(initial)
  const [when, setWhen] = useState<'today' | 'yday' | 'custom'>('today')
  const [custom, setCustom] = useState(addDays(today, -1))
  const date = when === 'today' ? today : when === 'yday' ? addDays(today, -1) : custom
  return (
    <main className="main">
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <input type="hidden" name="potId" value={potId} />
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="date" value={date} />
        <div className="titlebar">
          <Link className="gbtn" href={`/tabungan?pot=${potId}`} aria-label="Kembali"><IconBack /></Link>
          <h1 className="hl">{potName}</h1><span />
        </div>
        <div className="seg" role="radiogroup" aria-label="Jenis">
          <button type="button" role="radio" aria-checked={mode === 'in'} aria-pressed={mode === 'in'} onClick={() => setMode('in')}>Setor</button>
          <button type="button" role="radio" aria-checked={mode === 'out'} aria-pressed={mode === 'out'} onClick={() => setMode('out')}>Tarik</button>
        </div>
        <div className="grp">
          <label className="cell"><span className="bd label-w">Jumlah</span><input className="field left" name="amount" inputMode="numeric" required autoFocus placeholder="Rp 0" /></label>
          <label className="cell ln0"><span className="bd label-w">Catatan</span><input className="field left" name="note" placeholder={mode === 'in' ? 'mis. Sisa gaji' : 'mis. Servis motor'} maxLength={120} /></label>
          <div className="cell ln0" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <span className="bd" id="when">Tanggal</span>
            <div className="seg" role="radiogroup" aria-labelledby="when">
              <button type="button" role="radio" aria-checked={when === 'today'} aria-pressed={when === 'today'} onClick={() => setWhen('today')}>Hari ini</button>
              <button type="button" role="radio" aria-checked={when === 'yday'} aria-pressed={when === 'yday'} onClick={() => setWhen('yday')}>Kemarin</button>
              <button type="button" role="radio" aria-checked={when === 'custom'} aria-pressed={when === 'custom'} onClick={() => setWhen('custom')}>Pilih tanggal</button>
            </div>
            {when === 'custom' && <input type="date" aria-label="Tanggal lain" value={custom} max={today} onChange={(e) => e.target.value && setCustom(e.target.value)} style={{ height: 36, border: 'none', borderRadius: 8, background: 'var(--fill)', padding: '0 10px' }} />}
          </div>
          {mode === 'out' && <label className="cell ln0"><span className="bd grow">Catat juga sebagai pengeluaran</span><input type="checkbox" className="switch" name="counted" /></label>}
        </div>
        {mode === 'out' && <p className="fn ftr" style={{ margin: '-12px 0 0' }}>Nyalakan kalau uangnya langsung dipakai belanja. Kalau dipindah ke uang harian, biarkan mati supaya tidak terhitung dua kali.</p>}
        {state?.error && <div className="fn alert" role="alert">{state.error}</div>}
        <SubmitButton pendingText="Menyimpan…">{mode === 'in' ? 'Setor' : 'Tarik'}</SubmitButton>
      </form>
    </main>
  )
}
