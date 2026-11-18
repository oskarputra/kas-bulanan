'use client'

import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'
import { savePayday } from '@/lib/actions'
import { addDays, daysBetween, fmtDayShort, fmtShort, type Ymd } from '@/lib/dates'
import { periodOf, type Rule } from '@/lib/period'
import { IconBack, IconCheck } from '@/components/icons'
import { SubmitButton } from '@/components/SubmitButton'

export default function GajianForm({ today, rules, salary }: { today: Ymd; rules: Rule[]; salary: number }) {
  const [state, action] = useActionState(savePayday, undefined)
  const latest = rules[rules.length - 1]
  const [day, setDay] = useState(latest.day)
  const [weekend, setWeekend] = useState(latest.weekendShift)
  const [apply, setApply] = useState<'next' | 'now'>('next')
  const current = useMemo(() => periodOf(today, rules), [today, rules])
  const preview = useMemo(() => {
    const from = apply === 'now' ? current.start : addDays(current.end, 1)
    const kept = rules.filter((r) => r.effectiveFrom < from)
    const next: Rule[] = [...kept, { day, weekendShift: weekend, effectiveFrom: kept.length ? from : '2000-01-01' }]
    const now = periodOf(today, next)
    const nextPay = addDays(now.end, 1)
    return { now, nextPay, following: periodOf(nextPay, next) }
  }, [apply, current, rules, day, weekend, today])
  const left = daysBetween(today, preview.nextPay)
  const changed = day !== latest.day || weekend !== latest.weekendShift

  return (
    <main className="main">
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <input type="hidden" name="day" value={day} />
        <input type="hidden" name="apply" value={apply} />
        <div className="titlebar">
          <Link className="gbtn" href="/pengaturan" aria-label="Kembali ke Pengaturan"><IconBack /></Link>
          <h1 className="hl">Tanggal gajian</h1>
          <SubmitButton className="capsule fill small" pendingText="…" style={{ height: 44, borderRadius: 22 }}>Simpan</SubmitButton>
        </div>

        <section className="hero" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: '18px 20px' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--gold)', color: '#2E2100', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <div className="c2 strong">Tgl</div><div style={{ fontSize: 24, lineHeight: '26px', fontWeight: 700 }}>{day}</div>
          </div>
          <div className="grow" aria-live="polite">
            <div className="fn muted">Gajian berikutnya</div>
            <div className="t3" style={{ fontWeight: 700 }}>{fmtDayShort(preview.nextPay)}</div>
            <div className="fn" style={{ color: '#DCEBE3' }}>{left} hari lagi, periode sekarang {fmtShort(preview.now.start)} – {fmtShort(preview.now.end)}</div>
          </div>
        </section>

        <section>
          <div className="hdr"><h2 className="t3">Tanggal</h2></div>
          <div className="grp" style={{ padding: '10px 12px 12px' }}>
            <div className="days" role="radiogroup" aria-label="Tanggal gajian" style={{ rowGap: 4 }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className="day" role="radio" aria-checked={n === day} onClick={() => setDay(n)}><span>{n}</span></button>
              ))}
            </div>
          </div>
          <p className="fn ftr" style={{ margin: 0 }}>{day >= 29 ? `Di bulan yang tidak punya tanggal ${day}, gajian dihitung di hari terakhir bulan itu.` : 'Satu periode dihitung dari tanggal gajian sampai sehari sebelum gajian berikutnya.'}</p>
        </section>

        <section>
          <div className="grp">
            <label className="cell"><span className="bd grow">Majukan kalau akhir pekan</span><input type="checkbox" className="switch" name="weekendShift" checked={weekend} onChange={(e) => setWeekend(e.target.checked)} /></label>
            <label className="cell ln0"><span className="bd grow">Gaji bulanan</span><input className="field" name="salary" inputMode="numeric" defaultValue={salary || ''} placeholder="Rp 0" style={{ width: 150, flex: 'none' }} /></label>
          </div>
          <p className="fn ftr" style={{ margin: 0 }}>Gajian di hari Sabtu atau Minggu dihitung mulai Jumat sebelumnya. Gaji bulanan dipakai kalau pemasukan gaji belum dicatat.</p>
        </section>

        {changed && (
          <section>
            <div className="hdr"><h2 className="t3">Mulai berlaku</h2></div>
            <div className="grp" role="radiogroup" aria-label="Mulai berlaku">
              {([['next', 'Periode berikutnya', `Periode sekarang tetap ${fmtShort(current.start)} – ${fmtShort(current.end)}`], ['now', 'Periode sekarang', 'Batas periode ini ikut berubah, catatan dikelompokkan ulang']] as const).map(([id, title, sub], i) => (
                <button key={id} type="button" role="radio" aria-checked={apply === id} onClick={() => setApply(id)} className={'cell' + (i ? ' ln0' : '')} style={{ cursor: 'pointer' }}>
                  <span className="grow"><span className="bd" style={{ display: 'block' }}>{title}</span><span className="fn sec" style={{ display: 'block' }}>{sub}</span></span>
                  {apply === id && <IconCheck size={20} color="#1E6B52" />}
                </button>
              ))}
            </div>
          </section>
        )}
        {state?.error && <div className="fn alert" role="alert">{state.error}</div>}
      </form>
    </main>
  )
}
