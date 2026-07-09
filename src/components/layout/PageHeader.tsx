interface PageHeaderProps {
  title: string
  description: string
  updatedAt?: string
}

export function PageHeader({ title, description, updatedAt }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {updatedAt && (
        <span className="page-updated">마지막 업데이트: {updatedAt}</span>
      )}
    </div>
  )
}
