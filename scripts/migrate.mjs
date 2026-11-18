import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL belum diatur.')
  process.exit(1)
}

const client = postgres(url, { max: 1 })
await migrate(drizzle(client), { migrationsFolder: new URL('../drizzle', import.meta.url).pathname })
await client.end()
console.log('Migrasi selesai.')
