'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { register } from '@/lib/actions'
import { IconBack, IconCheck, IconEye, Logo, IconCalendar, Glyph } from '@/components/icons'
import { SubmitButton } from '@/components/SubmitButton'

export default function RegisterForm() {
  const [state, action] = useActionState(register, undefined)
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [agree, setAgree] = useState(false)
  const [day, setDay] = useState(Number(state?.fields?.payday ?? 25))
  const rules = [
    ['Minimal 8 karakter', pw.length >= 8],
    ['Ada huruf dan angka', /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)],
    ['Bukan kata sandi umum seperti 12345678', pw.length > 0 && !/^(12345678|123456789|password|qwerty|11111111|00000000)/i.test(pw)],
  ] as const
  const ready = agree && rules.every((r) => r[1])
  return (
    <main className="auth" style={{ paddingTop: 12, gap: 20 }}>
      <div className="topbar"><Link href="/masuk" className="gbtn lead" aria-label="Kembali ke halaman masuk"><IconBack /></Link><Logo size={44} id="reg-logo" /></div>
      <div>
        <h1 className="lt">Buat akun</h1>
        <p className="co sec" style={{ margin: '4px 0 0' }}>Dua menit, lalu kamu langsung bisa mencatat.</p>
      </div>
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section>
          <div className="grp">
            <label className="cell"><span className="bd label-w">Nama</span><input className="field left" name="name" autoComplete="name" required placeholder="Nama panggilan" defaultValue={state?.fields?.name} /></label>
            <label className="cell ln0"><span className="bd label-w">Email</span><input className="field left" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" defaultValue={state?.fields?.email} /></label>
            <label className="cell ln0"><span className="bd label-w">Kata sandi</span><input className="field left" name="password" type={show ? 'text' : 'password'} autoComplete="new-password" required placeholder="Minimal 8 karakter" value={pw} onChange={(e) => setPw(e.target.value)} aria-describedby="pw-rules" />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} style={{ width: 44, height: 44, margin: '-10px -12px -10px 0', border: 'none', background: 'transparent', color: 'var(--label-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconEye off={show} /></button>
            </label>
          </div>
          <ul id="pw-rules" style={{ listStyle: 'none', margin: 0, padding: '10px 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rules.map(([label, ok]) => (
              <li key={label} className="fn" style={{ display: 'flex', alignItems: 'center', gap: 8, color: ok ? 'var(--tint)' : 'var(--label-3)' }}>
                <span className={'check' + (ok ? ' on' : '')} style={{ width: 16, height: 16 }} aria-hidden="true">{ok && <IconCheck size={10} />}</span>{label}<span className="sr">{ok ? ', terpenuhi' : ', belum terpenuhi'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="hdr"><h2 className="t3">Atur cepat</h2><span className="fn sec">Bisa diubah nanti</span></div>
          <div className="grp">
            <div className="cell">
              <span className="sq" style={{ background: 'var(--tint)' }}><IconCalendar size={18} /></span>
              <span className="bd grow" id="payday-label">Tanggal gajian</span>
              <input type="hidden" name="payday" value={day} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }} role="group" aria-labelledby="payday-label">
                <button type="button" onClick={() => setDay(day <= 1 ? 31 : day - 1)} aria-label="Kurangi tanggal" style={{ width: 44, height: 34, border: 'none', borderRadius: '8px 0 0 8px', background: 'var(--fill)', fontSize: 20, cursor: 'pointer' }}>−</button>
                <span className="bd strong" aria-live="polite" style={{ minWidth: 40, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--fill)' }}>{day}</span>
                <button type="button" onClick={() => setDay(day >= 31 ? 1 : day + 1)} aria-label="Tambah tanggal" style={{ width: 44, height: 34, border: 'none', borderRadius: '0 8px 8px 0', background: 'var(--fill)', fontSize: 20, cursor: 'pointer' }}>+</button>
              </span>
            </div>
            <label className="cell">
              <span className="sq" style={{ background: '#B25000' }}><Glyph d="M3 6h18v12H3zM9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0" size={18} /></span>
              <span className="bd grow">Gaji bulanan</span>
              <input className="field" name="salary" inputMode="numeric" placeholder="Opsional" style={{ width: 140, flex: 'none' }} defaultValue={state?.fields?.salary} />
            </label>
          </div>
          <p className="fn ftr" style={{ margin: 0 }}>Dipakai untuk menghitung periode dan sisa uang sampai gajian. Pengeluaran rutin bisa ditambahkan setelah akun dibuat.</p>
        </section>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0 4px', cursor: 'pointer' }}>
          <input type="checkbox" name="agree" className="sr" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className={'check' + (agree ? ' on' : '')} aria-hidden="true" style={{ marginTop: -1 }}>{agree && <IconCheck size={12} />}</span>
          <span className="sh">Saya setuju dengan Ketentuan dan Kebijakan privasi Kas Bulanan.</span>
        </label>
        {state?.error && <div className="fn alert" role="alert">{state.error}</div>}
        <SubmitButton disabled={!ready} pendingText="Membuat akun…">Buat akun</SubmitButton>
      </form>
      <p className="sh" style={{ textAlign: 'center', margin: 0 }}>Sudah punya akun? <Link href="/masuk" style={{ fontWeight: 600 }}>Masuk</Link></p>
    </main>
  )
}
