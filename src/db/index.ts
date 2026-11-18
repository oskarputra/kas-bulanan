import 'server-only'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL belum diatur. Salin .env.example ke .env lalu isi koneksinya.')

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> }
const client = globalForDb.pg ?? postgres(url, { max: 10 })
if (process.env.NODE_ENV !== 'production') globalForDb.pg = client

export const db = drizzle(client, { schema })
export { schema }
