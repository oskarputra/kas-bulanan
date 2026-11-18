import 'server-only'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'
import { connectionOptions } from './options'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL belum diatur. Salin .env.example ke .env lalu isi koneksinya.')

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> }
const client = globalForDb.pg ?? postgres(url, connectionOptions(url))
// Simpan client di globalThis supaya dipakai ulang: saat hot reload di dev,
// dan antar-request di fungsi serverless Vercel yang masih hangat.
globalForDb.pg = client

export const db = drizzle(client, { schema })
export { schema }
