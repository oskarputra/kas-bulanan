// Semua tanggal disimpan sebagai string 'YYYY-MM-DD' supaya tidak terpengaruh zona waktu server.

export type Ymd = string

const pad = (n: number) => String(n).padStart(2, '0')

export function ymd(y: number, m: number, d: number): Ymd {
  // m berbasis 0; normalisasi lewat UTC supaya overflow bulan/tahun tertangani
  const dt = new Date(Date.UTC(y, m, d))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

export function parts(s: Ymd): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m: m - 1, d }
}

export function addDays(s: Ymd, n: number): Ymd {
  const { y, m, d } = parts(s)
  return ymd(y, m, d + n)
}

export function daysBetween(a: Ymd, b: Ymd): number {
  const pa = parts(a), pb = parts(b)
  return Math.round((Date.UTC(pb.y, pb.m, pb.d) - Date.UTC(pa.y, pa.m, pa.d)) / 86400000)
}

export function lastDayOfMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
}

export function weekday(s: Ymd): number {
  const { y, m, d } = parts(s)
  return new Date(Date.UTC(y, m, d)).getUTCDay() // 0 = Minggu
}

export function todayYmd(tz = process.env.APP_TZ || 'Asia/Jakarta'): Ymd {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function fmtShort(s: Ymd): string {
  const { m, d } = parts(s)
  return `${d} ${MONTHS_SHORT[m]}`
}

export function fmtLong(s: Ymd): string {
  const { y, m, d } = parts(s)
  return `${DAYS[weekday(s)]}, ${d} ${MONTHS[m]} ${y}`
}

export function fmtDayShort(s: Ymd): string {
  const { m, d } = parts(s)
  return `${DAYS[weekday(s)]}, ${d} ${MONTHS_SHORT[m]}`
}

export function isYmd(s: unknown): s is Ymd {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
}
