import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page-stack">
      <PageHeader
        description="해당 기능은 추후 구현 예정입니다."
        title={title}
      />
      <Card>
        <div className="empty-state">해당 기능은 추후 구현 예정입니다.</div>
      </Card>
    </div>
  )
}
