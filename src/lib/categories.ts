export type CategoryDef = { key: string; label: string; icon: string; color: string }

export const ICONS: Record<string, string> = {
  makan: 'M3 11h18a9 9 0 0 1-18 0ZM8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3',
  transport: 'M3 17a3 3 0 1 0 6 0a3 3 0 1 0-6 0M15 17a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6 17l4-7h5l3 7M10 10 8 6H5',
  belanja: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
  tagihan: 'M13 2 4 14h7l-1 8 9-12h-7z',
  rumah: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  hiburan: 'M3 5h18v12H3zM8 21h8M10 9l4 2-4 2z',
  kesehatan: 'M12 20s-8-4.5-8-10.5A4.5 4.5 0 0 1 12 6.7 4.5 4.5 0 0 1 20 9.5C20 15.5 12 20 12 20z',
  lainnya: 'M6 12h.01M12 12h.01M18 12h.01',
  keluarga: 'M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6',
  pendidikan: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5',
  internet: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
  asuransi: 'M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z',
  gaji: 'M3 6h18v12H3zM9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  bonus: 'M12 3l2.6 5.6 5.4.7-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.7z',
  usaha: 'M4 21V9l8-6 8 6v12M9 21v-6h6v6',
  hadiah: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
  tabungan: 'M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z',
}

// Warna sistem Apple versi kontras tinggi, aman untuk ikon putih
export const OUT_CATEGORIES: CategoryDef[] = [
  { key: 'makan', label: 'Makan', icon: 'makan', color: '#C93400' },
  { key: 'transportasi', label: 'Transportasi', icon: 'transport', color: '#0040DD' },
  { key: 'belanja', label: 'Belanja', icon: 'belanja', color: '#D70015' },
  { key: 'tagihan', label: 'Tagihan', icon: 'tagihan', color: '#8944AB' },
  { key: 'rumah', label: 'Kos & rumah', icon: 'rumah', color: '#248A3D' },
  { key: 'hiburan', label: 'Hiburan', icon: 'hiburan', color: '#0071A4' },
  { key: 'kesehatan', label: 'Kesehatan', icon: 'kesehatan', color: '#D30F45' },
  { key: 'keluarga', label: 'Keluarga', icon: 'keluarga', color: '#3634A3' },
  { key: 'pendidikan', label: 'Pendidikan', icon: 'pendidikan', color: '#7F6545' },
  { key: 'lainnya', label: 'Lainnya', icon: 'lainnya', color: '#6C6C70' },
]

export const IN_CATEGORIES: CategoryDef[] = [
  { key: 'gaji', label: 'Gaji', icon: 'gaji', color: '#248A3D' },
  { key: 'bonus', label: 'Bonus', icon: 'bonus', color: '#B25000' },
  { key: 'usaha', label: 'Usaha', icon: 'usaha', color: '#0040DD' },
  { key: 'hadiah', label: 'Hadiah', icon: 'hadiah', color: '#D30F45' },
  { key: 'lainnya_in', label: 'Lainnya', icon: 'lainnya', color: '#6C6C70' },
]

const ALL = [...OUT_CATEGORIES, ...IN_CATEGORIES, { key: 'tabungan', label: 'Tabungan', icon: 'tabungan', color: '#B25000' }]

export function category(key: string): CategoryDef {
  return ALL.find((c) => c.key === key) ?? { key, label: key, icon: 'lainnya', color: '#6C6C70' }
}

export const OUT_KEYS = OUT_CATEGORIES.map((c) => c.key)
export const IN_KEYS = IN_CATEGORIES.map((c) => c.key)

export const POT_COLORS: Record<string, { bg: string; fg: string; track: string; bar: string }> = {
  green: { bg: 'linear-gradient(150deg, #2A7A5E, #123A2F)', fg: '#FFFFFF', track: 'rgba(255,255,255,.22)', bar: '#F2CC6B' },
  blue: { bg: 'linear-gradient(150deg, #3D7BE0, #0040DD)', fg: '#FFFFFF', track: 'rgba(255,255,255,.25)', bar: '#FFFFFF' },
  gold: { bg: 'linear-gradient(150deg, #F8DC93, #EDB948)', fg: '#2E2100', track: 'rgba(46,33,0,.15)', bar: '#2E2100' },
  purple: { bg: 'linear-gradient(150deg, #A365C9, #6B2E8F)', fg: '#FFFFFF', track: 'rgba(255,255,255,.25)', bar: '#FFFFFF' },
  red: { bg: 'linear-gradient(150deg, #E5484D, #A3141B)', fg: '#FFFFFF', track: 'rgba(255,255,255,.25)', bar: '#FFFFFF' },
}
