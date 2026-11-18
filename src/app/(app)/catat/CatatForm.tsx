'use client'

import Link from 'next/link'
import { useActionState, useEffect, useMemo, useState } from 'react'
import { saveTransaction, deleteTransaction } from '@/lib/actions'
import { IN_CATEGORIES, OUT_CATEGORIES, ICONS } from '@/lib/categories'
import { addDays, fmtDayShort, fmtShort, type Ymd } from '@/lib/dates'
import { periodOf, type Rule } from '@/lib/period'
import { IconClose, IconCheck } from '@/components/icons'

type Initial = { id: string; type: 'in' | 'out'; amount: number; category: string; date: string; note: string } | null

export default function CatatForm({ today, rules, initial, defaultType, back }: { today: Ymd; rules: Rule[]; initial: Initial; defaultType: 'in' | 'out'; back: string }) {
  const [state, action, pending] = useActionState(saveTransaction, undefined)
  const [type, setType] = useState<'in' | 'out'>(initial?.type ?? defaultType)
  const [digits, setDigits] = useState(initial ? String(initial.amount) : '')
  const [cat, setCat] = useState(initial?.category ?? (defaultType === 'in' ? 'gaji' : 'makan'))
  const yesterday = addDays(today, -1)
  const initMode = !initial || initial.date === today ? 'today' : initial.date === yesterday ? 'yday' : 'custom'
  const [mode, setMode] = useState<'today' | 'yday' | 'custom'>(initMode)
  const [custom, setCustom] = useState<Ymd>(initial?.date ?? yesterday)
  const [note, setNote] = useState(initial?.note ?? '')
  const date = mode === 'today' ? today : mode === 'yday' ? yesterday : custom
  const current = useMemo(() => periodOf(today, rules), [today, rules])
  const target = useMemo(() => (date ? periodOf(date, rules) : current), [date, rules, current])
  const cats = type === 'out' ? OUT_CATEGORIES : IN_CATEGORIES
  const amount = Number(digits || '0')
  const amountText = amount.toLocaleString('id-ID')

  const press = (k: string) => {
    if (k === 'del') return setDigits((d) => d.slice(0, -1))
    setDigits((d) => (d + k).replace(/^0+/, '').slice(0, 12))
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key) }
      else if (e.key === 'Backspace') { e.preventDefault(); press('del') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const switchType = (t: 'in' | 'out') => { setType(t); setCat(t === 'in' ? 'gaji' : 'makan') }
  const title = initial ? 'Ubah catatan' : type === 'out' ? 'Pengeluaran baru' : 'Pemasukan baru'
  const closeHref = back === 'transaksi' ? '/transaksi' : '/'

  return (
    <main className="main" style={{ paddingBottom: 32 }}>
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="hidden" name="id" value={initial?.id ?? ''} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="amount" value={digits} />
        <input type="hidden" name="category" value={cat} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="back" value={back} />
        <div className="titlebar">
          <Link className="gbtn" href={closeHref} aria-label="Batal"><IconClose /></Link>
          <h1 className="hl">{title}</h1>
          <button className="gbtn tint" type="submit" aria-label="Simpan" disabled={pending || amount <= 0} style={{ opacity: amount <= 0 ? .4 : 1 }}><IconCheck size={20} /></button>
        </div>

        {!initial && (
          <div className="seg" role="radiogroup" aria-label="Jenis catatan">
            <button type="button" role="radio" aria-checked={type === 'out'} aria-pressed={type === 'out'} onClick={() => switchType('out')}>Pengeluaran</button>
            <button type="button" role="radio" aria-checked={type === 'in'} aria-pressed={type === 'in'} onClick={() => switchType('in')}>Pemasukan</button>
          </div>
        )}

        <div style={{ textAlign: 'center' }} aria-live="polite">
          <span className="sr">Jumlah</span>
          <div style={{ fontSize: 48, lineHeight: '56px', fontWeight: 700, letterSpacing: '-.5px', color: amount === 0 ? '#AEAEB2' : type === 'in' ? 'var(--tint)' : 'var(--label)' }}>
            <span style={{ fontSize: 28, fontWeight: 600, color: 'var(--label-3)', marginRight: 6 }}>Rp</span>{amountText}
          </div>
        </div>

        <div className="cats" role="radiogroup" aria-label="Kategori">
          {cats.map((c) => (
            <button key={c.key} type="button" className="cat" role="radio" aria-checked={cat === c.key} onClick={() => setCat(c.key)} style={{ ['--c' as string]: c.color }}>
              <span className="tile" style={{ background: c.color }}><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[c.icon]} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              {c.label}
            </button>
          ))}
        </div>

        <div className="grp">
          <div className="cell" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, paddingTop: 12, paddingBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="bd" id="date-label">Tanggal</span>
              <span className="sh strong" style={{ color: 'var(--tint)' }}>{fmtDayShort(date)}</span>
            </div>
            <div className="seg" role="radiogroup" aria-labelledby="date-label">
              <button type="button" role="radio" aria-checked={mode === 'today'} aria-pressed={mode === 'today'} onClick={() => setMode('today')}>Hari ini</button>
              <button type="button" role="radio" aria-checked={mode === 'yday'} aria-pressed={mode === 'yday'} onClick={() => setMode('yday')}>Kemarin</button>
              <button type="button" role="radio" aria-checked={mode === 'custom'} aria-pressed={mode === 'custom'} onClick={() => setMode('custom')}>Pilih tanggal</button>
            </div>
            {mode === 'custom' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="bd grow">Tanggal lain</span>
                <input type="date" value={custom} max={today} onChange={(e) => e.target.value && setCustom(e.target.value)} style={{ height: 36, border: 'none', borderRadius: 8, background: 'var(--fill)', padding: '0 10px', fontSize: 17 }} />
              </label>
            )}
          </div>
          <div className="cell ln0 fn" style={target.start !== current.start ? { color: '#8A4B00', background: '#FFF6E5' } : { color: 'var(--label-3)' }}>
            {target.start === current.start
              ? `Masuk ke periode sekarang, ${fmtShort(current.start)} – ${fmtShort(current.end)}.`
              : `Masuk ke periode ${fmtShort(target.start)} – ${fmtShort(target.end)}, bukan periode sekarang. Laporan periode itu ikut diperbarui.`}
          </div>
          <label className="cell ln0">
            <span className="bd">Catatan</span>
            <input className="field" name="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" maxLength={200} />
          </label>
        </div>

        {state?.error && <div className="fn alert" role="alert">{state.error}</div>}

        <div className="keypad" aria-label="Papan angka">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map((k) => (
            <button key={k} type="button" className={'key' + (k === 'del' || k === '000' ? ' alt' : '')} onClick={() => press(k)} aria-label={k === 'del' ? 'Hapus angka' : k}>{k === 'del' ? '⌫' : k}</button>
          ))}
        </div>
        <button type="submit" className="capsule fill block" disabled={pending || amount <= 0}>{pending ? 'Menyimpan…' : `Simpan Rp ${amountText}`}</button>
      </form>
      {initial && (
        <form action={async (fd) => { await deleteTransaction(fd); window.location.href = closeHref }}>
          <input type="hidden" name="id" value={initial.id} />
          <button type="submit" className="capsule destructive block">Hapus catatan ini</button>
        </form>
      )}
    </main>
  )
}
