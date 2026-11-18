// Pemakaian: DATABASE_URL=... node scripts/reset-password.mjs email@contoh.com KataSandiBaru123
import postgres from 'postgres'
import bcrypt from 'bcryptjs'

const [email, password] = process.argv.slice(2)
if (!email || !password || password.length < 8) {
  console.error('Pemakaian: node scripts/reset-password.mjs <email> <kata-sandi-baru (min. 8 karakter)>')
  process.exit(1)
}
const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL belum diatur.')
  process.exit(1)
}
const host = new URL(url).hostname
const isLocal = host === 'localhost' || host === '127.0.0.1' || host === 'db'
const sql = postgres(url, { max: 1, prepare: !url.includes(':6543'), ssl: isLocal ? false : 'require' })
const hash = await bcrypt.hash(password, 11)
const rows = await sql`update users set password_hash = ${hash} where email = ${email.toLowerCase()} returning id`
if (rows.length) await sql`delete from sessions where user_id = ${rows[0].id}`
console.log(rows.length ? 'Kata sandi diganti, semua sesi dikeluarkan.' : 'Email tidak ditemukan.')
await sql.end()
