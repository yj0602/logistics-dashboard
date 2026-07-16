interface PageHeaderProps {
  title: string
  description: string
  updatedAt?: string
}

export function PageHeader({ title, description, }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
        <span className="page-updated">지연 기준 11:00</span>
    </div>
  )
}
