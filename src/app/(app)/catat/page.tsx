import { and, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/auth'
import { getContext } from '@/lib/data'
import CatatForm from './CatatForm'

export const metadata = { title: 'Catat' }

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string; type?: string; back?: string }> }) {
  const user = await requireUser()
  const sp = await searchParams
  const { today, rules } = await getContext(user)
  let initial: { id: string; type: 'in' | 'out'; amount: number; category: string; date: string; note: string } | null = null
  if (sp.id) {
    const [t] = await db.select().from(schema.transactions).where(and(eq(schema.transactions.id, sp.id), eq(schema.transactions.userId, user.id), eq(schema.transactions.source, 'manual')))
    if (!t) notFound()
    initial = { id: t.id, type: t.type, amount: t.amount, category: t.category, date: t.date, note: t.note }
  }
  return <CatatForm today={today} rules={rules} initial={initial} defaultType={sp.type === 'in' ? 'in' : 'out'} back={sp.back === 'transaksi' ? 'transaksi' : ''} />
}
