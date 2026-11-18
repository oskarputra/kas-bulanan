import { and, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/auth'
import { todayYmd } from '@/lib/dates'
import MoveForm from './MoveForm'

export const metadata = { title: 'Setor atau tarik' }

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mode?: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const { mode } = await searchParams
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const [pot] = await db.select().from(schema.pots).where(and(eq(schema.pots.id, id), eq(schema.pots.userId, user.id)))
  if (!pot) notFound()
  return <MoveForm potId={pot.id} potName={pot.name} mode={mode === 'out' ? 'out' : 'in'} today={todayYmd()} />
}
