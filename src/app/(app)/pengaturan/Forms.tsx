'use client'

import { useActionState } from 'react'
import { updateProfile, changePassword } from '@/lib/actions'
import { SubmitButton } from '@/components/SubmitButton'

export function ProfileForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateProfile, undefined)
  return (
    <form action={action}>
      <div className="hdr"><h2 className="t3">Profil</h2></div>
      <div className="grp">
        <label className="cell"><span className="bd label-w">Nama</span><input className="field left" name="name" defaultValue={name} required /></label>
      </div>
      {state?.error && <div className="fn alert" role="alert" style={{ marginTop: 8 }}>{state.error}</div>}
      <div style={{ marginTop: 10 }}><SubmitButton className="capsule tinted small" pendingText="Menyimpan…">Simpan nama</SubmitButton></div>
    </form>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined)
  return (
    <form action={action}>
      <div className="hdr"><h2 className="t3">Kata sandi</h2></div>
      <div className="grp">
        <label className="cell"><span className="bd label-w">Sekarang</span><input className="field left" type="password" name="current" autoComplete="current-password" required /></label>
        <label className="cell ln0"><span className="bd label-w">Baru</span><input className="field left" type="password" name="next" autoComplete="new-password" required placeholder="Minimal 8 karakter, huruf dan angka" /></label>
      </div>
      {state?.error && <div className="fn alert" role="alert" style={{ marginTop: 8 }}>{state.error}</div>}
      <div style={{ marginTop: 10 }}><SubmitButton className="capsule tinted small" pendingText="Mengganti…">Ganti kata sandi</SubmitButton></div>
    </form>
  )
}
