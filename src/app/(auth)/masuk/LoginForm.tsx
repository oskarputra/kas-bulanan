'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { login } from '@/lib/actions'
import { IconEye, Logo, IconCheck } from '@/components/icons'
import { SubmitButton } from '@/components/SubmitButton'

export default function LoginForm() {
  const [state, action] = useActionState(login, undefined)
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  return (
    <main className="auth">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <span style={{ display: 'block', borderRadius: 19, boxShadow: '0 10px 24px rgba(18,58,47,.25)' }}><Logo size={84} id="login-logo" /></span>
        <div>
          <h1 className="t1">Masuk ke Kas Bulanan</h1>
          <p className="co sec" style={{ margin: '6px 0 0' }}>Catat pengeluaran dan pantau sisa gaji sampai gajian berikutnya.</p>
        </div>
      </div>
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="grp">
          <label className="cell"><span className="bd label-w">Email</span><input className="field left" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" defaultValue={state?.fields?.email} /></label>
          <label className="cell ln0"><span className="bd label-w">Kata sandi</span><input className="field left" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required placeholder="Wajib" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} style={{ width: 44, height: 44, margin: '-10px -12px -10px 0', border: 'none', background: 'transparent', color: 'var(--label-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconEye off={show} /></button>
          </label>
        </div>
        {state?.error && <div className="fn alert" role="alert">{state.error}</div>}
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 4px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', cursor: 'pointer' }}>
            <input type="checkbox" name="remember" className="sr" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className={'check' + (remember ? ' on' : '')} aria-hidden="true">{remember && <IconCheck size={12} />}</span>
            <span className="sh">Ingat saya</span>
          </label>
        </div>
        <SubmitButton pendingText="Memeriksa…" className="capsule fill block" style={{ marginTop: 8 }}>Masuk</SubmitButton>
      </form>
      <p className="sh" style={{ marginTop: 'auto', textAlign: 'center' }}>Belum punya akun? <Link href="/daftar" style={{ fontWeight: 600 }}>Daftar</Link></p>
    </main>
  )
}
