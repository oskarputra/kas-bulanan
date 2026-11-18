import type { Options } from 'postgres'

/**
 * Opsi koneksi yang cocok untuk Supabase maupun Postgres lokal.
 *
 * - Supabase pooler mode transaksi (port 6543, dipakai di Vercel) tidak
 *   mendukung prepared statement, jadi `prepare` dimatikan.
 * - Di serverless tiap instance cukup 1 koneksi; pooler yang membagi koneksinya.
 * - Selain localhost / container docker, koneksi wajib SSL.
 */
export function connectionOptions(url: string): Options<Record<string, never>> {
  const host = new URL(url).hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === 'db'
  const pooled = url.includes(':6543') || url.includes('pooler.supabase.com')
  return {
    max: process.env.VERCEL ? 1 : 10,
    prepare: !pooled,
    ssl: isLocal ? false : 'require',
    idle_timeout: 20,
  }
}
