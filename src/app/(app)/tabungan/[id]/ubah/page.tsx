import { and, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/auth'
import PotForm from '../../PotForm'

export const metadata = { title: 'Ubah tabungan' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const [pot] = await db.select().from(schema.pots).where(and(eq(schema.pots.id, id), eq(schema.pots.userId, user.id)))
  if (!pot) notFound()
  return <PotForm pot={pot} />
}
