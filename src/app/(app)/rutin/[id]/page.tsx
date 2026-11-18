import { and, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/auth'
import { potBalances } from '@/lib/data'
import RecurringForm from '../RecurringForm'

export const metadata = { title: 'Ubah rutin' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const [item] = await db.select().from(schema.recurringItems).where(and(eq(schema.recurringItems.id, id), eq(schema.recurringItems.userId, user.id), eq(schema.recurringItems.active, true)))
  if (!item) notFound()
  const pots = await potBalances(user.id)
  return <RecurringForm item={item} pots={pots.map((p) => ({ id: p.id, name: p.name }))} />
}
