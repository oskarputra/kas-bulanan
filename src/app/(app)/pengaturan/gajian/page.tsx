import { requireUser } from '@/lib/auth'
import { getContext } from '@/lib/data'
import GajianForm from './GajianForm'

export const metadata = { title: 'Tanggal gajian' }

export default async function Page() {
  const user = await requireUser()
  const { today, rules } = await getContext(user)
  return <GajianForm today={today} rules={rules} salary={user.salary} />
}
