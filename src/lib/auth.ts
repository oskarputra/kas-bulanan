import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { db, schema } from '@/db'

const COOKIE = 'kb_session'
const MAX_AGE_DAYS = 30

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export async function createSession(userId: string, remember = true) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + MAX_AGE_DAYS * 86400000)
  await db.insert(schema.sessions).values({ id: hash(token), userId, expiresAt })
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIE !== '1',
    sameSite: 'lax',
    path: '/',
    ...(remember ? { expires: expiresAt } : {}),
  })
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, hash(token)))
  store.delete(COOKIE)
}

/** Pengguna yang sedang masuk, atau null. Di-cache per request. */
export const getUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, hash(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1)
  return rows[0]?.user ?? null
})

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/masuk')
  return user
}
