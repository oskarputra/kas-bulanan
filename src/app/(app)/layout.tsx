import { requireUser } from '@/lib/auth'
import { Sidebar, TabBar } from '@/components/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <div className="shell">
      <Sidebar name={user.name} />
      <div>{children}</div>
      <TabBar />
    </div>
  )
}
