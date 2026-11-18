const nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export function rp(n: number): string {
  const s = nf.format(Math.abs(Math.round(n)))
  return (n < 0 ? '−' : '') + 'Rp ' + s
}

/** Bentuk ringkas: Rp 4,85 jt / Rp 85 rb */
export function rpShort(n: number): string {
  const a = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (a >= 1_000_000) {
    const v = (a / 1_000_000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
    return `${sign}Rp ${v} jt`
  }
  if (a >= 1_000) return `${sign}Rp ${Math.round(a / 1000)} rb`
  return `${sign}Rp ${a}`
}

/** Ambil angka dari input bebas seperti "Rp 12.000.000". */
export function parseAmount(v: FormDataEntryValue | null): number {
  if (typeof v !== 'string') return 0
  const digits = v.replace(/[^0-9]/g, '')
  return digits ? Math.min(Number(digits), 999_999_999_999) : 0
}
