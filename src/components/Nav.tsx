'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TabIcon, Logo, IconCalendar, IconGear, IconPlus } from './icons'

const TABS = [
  { href: '/', label: 'Beranda', icon: 'house' as const },
  { href: '/laporan', label: 'Laporan', icon: 'chart' as const },
  { href: '/tabungan', label: 'Tabungan', icon: 'wallet' as const },
  { href: '/rutin', label: 'Rutin', icon: 'repeat' as const },
]

function isActive(path: string, href: string) {
  if (href === '/') return path === '/' || path.startsWith('/transaksi')
  return path === href || path.startsWith(href + '/')
}

export function TabBar() {
  const path = usePathname()
  if (path.startsWith('/catat')) return null
  return (
    <nav className="tabbar" aria-label="Navigasi utama">
      {TABS.map((t) => {
        const on = isActive(path, t.href)
        return (
          <Link key={t.href} href={t.href} className="tab" aria-current={on ? 'page' : undefined}>
            <TabIcon name={t.icon} filled={on} />{t.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({ name }: { name: string }) {
  const path = usePathname()
  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px' }}>
        <Logo size={36} id="side-logo" />
        <span className="hl">Kas Bulanan</span>
      </div>
      <Link href="/catat" className="capsule fill" style={{ height: 44 }}><IconPlus />Catat pengeluaran</Link>
      <nav aria-label="Navigasi utama" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {TABS.map((t) => {
          const on = isActive(path, t.href)
          return <Link key={t.href} href={t.href} className="side-link" aria-current={on ? 'page' : undefined}><TabIcon name={t.icon} filled={on} />{t.label}</Link>
        })}
        <Link href="/pengaturan/gajian" className="side-link" aria-current={path === '/pengaturan/gajian' ? 'page' : undefined}><IconCalendar size={24} />Tanggal gajian</Link>
        <Link href="/pengaturan" className="side-link" aria-current={path === '/pengaturan' ? 'page' : undefined}><IconGear size={24} />{name}</Link>
      </nav>
    </aside>
  )
}
