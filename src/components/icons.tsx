import { ICONS, category } from '@/lib/categories'

type P = { size?: number; className?: string }
const S = (d: string, w = 2) => ({ d, fill: 'none', stroke: 'currentColor', strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const })

export function Glyph({ d, size = 20, w = 2 }: { d: string; size?: number; w?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...S(d, w)} /></svg>
}

export const IconPlus = ({ size = 20 }: P) => <Glyph d="M12 5v14M5 12h14" size={size} w={2.4} />
export const IconBack = ({ size = 20 }: P) => <Glyph d="M15 18l-6-6 6-6" size={size} w={2.4} />
export const IconClose = ({ size = 18 }: P) => <Glyph d="M6 6l12 12M18 6 6 18" size={size} w={2.2} />
export const IconCheck = ({ size = 14, color = '#FFFFFF' }: P & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconChevron = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="#C4C4C7" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconCalendar = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" /><path {...S('M3 9h18M8 3v4M16 3v4')} /></svg>
)
export const IconGear = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><path {...S('M4 21a8 8 0 0 1 16 0')} /></svg>
)
export const IconShare = ({ size = 20 }: P) => <Glyph d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" size={size} />
export const IconSpark = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none', marginTop: 1 }}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="#F2CC6B" /></svg>
)
export const IconUp = ({ size = 18 }: P) => <Glyph d="M12 19V5M5 12l7-7 7 7" size={size} w={2.4} />
export const IconDown = ({ size = 18 }: P) => <Glyph d="M12 5v14M5 12l7 7 7-7" size={size} w={2.4} />
export const IconEye = ({ off }: { off?: boolean }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    {off && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
  </svg>
)

export function TabIcon({ name, filled }: { name: 'house' | 'chart' | 'wallet' | 'repeat'; filled?: boolean }) {
  const p = { width: 26, height: 26, viewBox: '0 0 24 24', 'aria-hidden': true }
  if (name === 'house') return <svg {...p}><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.9} strokeLinejoin="round" /></svg>
  if (name === 'chart') return filled
    ? <svg {...p}><g fill="currentColor"><rect x="3.5" y="10.5" width="5" height="10" rx="1.2" /><rect x="9.5" y="3.5" width="5" height="17" rx="1.2" /><rect x="15.5" y="13.5" width="5" height="7" rx="1.2" /></g></svg>
    : <svg {...p}><g fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="11" width="4" height="9" rx="1" /><rect x="10" y="4" width="4" height="16" rx="1" /><rect x="16" y="14" width="4" height="6" rx="1" /></g></svg>
  if (name === 'wallet') return filled
    ? <svg {...p}><rect x="3" y="5" width="18" height="15" rx="3.5" fill="currentColor" /><path d="M3 10h18" stroke="#FFFFFF" strokeWidth="1.8" /><path d="M15.5 15h2.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" /></svg>
    : <svg {...p}><g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h2" /></g></svg>
  return <svg {...p}><g fill="none" stroke="currentColor" strokeWidth={filled ? 2.6 : 1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></g></svg>
}

export function CatIcon({ cat, size = 32, radius = 9, glyph = 18 }: { cat: string; size?: number; radius?: number; glyph?: number }) {
  const c = category(cat)
  return (
    <span className="sq" style={{ width: size, height: size, borderRadius: radius, background: c.color }}>
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[c.icon]} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  )
}

export function Logo({ size = 72, id = 'lg' }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Logo Kas Bulanan">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2A7A5E" /><stop offset="1" stopColor="#123A2F" /></linearGradient></defs>
      <rect width="100" height="100" rx="23" fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="11" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="#F2CC6B" strokeWidth="11" strokeLinecap="round" strokeDasharray="118 157.1" transform="rotate(-90 50 50)" />
      <circle cx="32.3" cy="32.3" r="7.5" fill="#FFFFFF" />
    </svg>
  )
}

export function Ring({ value, size = 76, stroke = 8, color = '#F2CC6B', track = 'rgba(255,255,255,.16)', children, label }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode; label: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div role="img" aria-label={label} style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {v > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * v).toFixed(1)} ${c.toFixed(1)}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  )
}
