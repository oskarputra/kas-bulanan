import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getRules } from '@/lib/data'
import { logout } from '@/lib/actions'
import { rp } from '@/lib/money'
import { IconBack, IconCalendar, IconChevron, Logo } from '@/components/icons'
import { ProfileForm, PasswordForm } from './Forms'

export const metadata = { title: 'Pengaturan' }

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser()
  const { ok } = await searchParams
  const rules = await getRules(user.id)
  const rule = rules[rules.length - 1]
  return (
    <main className="main">
      <div className="titlebar">
        <Link className="gbtn" href="/" aria-label="Kembali ke Beranda"><IconBack /></Link>
        <h1 className="hl">Pengaturan</h1><span />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Logo size={56} id="set-logo" />
        <div><div className="t3">{user.name}</div><div className="sh sec">{user.email}</div></div>
      </div>
      {ok === 'sandi' && <div className="fn notice" role="status" style={{ background: '#E1F3E8', color: 'var(--tint)' }}>Kata sandi diganti. Sesi di perangkat lain sudah dikeluarkan.</div>}
      <section>
        <div className="hdr"><h2 className="t3">Gajian</h2></div>
        <div className="grp">
          <Link href="/pengaturan/gajian" className="cell">
            <span className="sq" style={{ background: 'var(--tint)' }}><IconCalendar size={18} /></span>
            <span className="bd grow">Tanggal gajian</span><span className="bd sec">Tanggal {rule.day}</span><IconChevron />
          </Link>
          <Link href="/pengaturan/gajian" className="cell ln">
            <span className="sq" style={{ background: '#B25000' }}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /></svg></span>
            <span className="bd grow">Gaji bulanan</span><span className="bd sec">{user.salary ? rp(user.salary) : 'Belum diisi'}</span><IconChevron />
          </Link>
        </div>
      </section>
      <ProfileForm name={user.name} />
      <PasswordForm />
      <form action={logout}><button className="capsule destructive block">Keluar</button></form>
    </main>
  )
}
