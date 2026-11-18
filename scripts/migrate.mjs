// Migrasi pakai DIRECT_URL (koneksi langsung / session pooler port 5432) kalau ada,
// karena pooler mode transaksi (port 6543) kurang cocok untuk DDL.
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL belum diatur.')
  process.exit(1)
}

const host = new URL(url).hostname
const isLocal = host === 'localhost' || host === '127.0.0.1' || host === 'db'
const client = postgres(url, {
  max: 1,
  prepare: !url.includes(':6543'),
  ssl: isLocal ? false : 'require',
  onnotice: () => {},
})
await migrate(drizzle(client), { migrationsFolder: new URL('../drizzle', import.meta.url).pathname })
await client.end()
console.log('Migrasi selesai.')
