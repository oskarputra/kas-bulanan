import { requireUser } from '@/lib/auth'
import { potBalances } from '@/lib/data'
import RecurringForm from '../RecurringForm'

export const metadata = { title: 'Rutin baru' }

export default async function Page() {
  const user = await requireUser()
  const pots = await potBalances(user.id)
  return <RecurringForm pots={pots.map((p) => ({ id: p.id, name: p.name }))} />
}
