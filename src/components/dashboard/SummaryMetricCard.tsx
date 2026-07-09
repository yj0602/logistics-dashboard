interface SummaryMetricCardProps {
  label: string
  value: string
  description: string
  tone?: 'blue' | 'green' | 'red' | 'purple'
}

export function SummaryMetricCard({
  label,
  value,
  description,
  tone = 'blue',
}: SummaryMetricCardProps) {
  return (
    <div className="metric-card">
      <span className={`metric-icon tone-${tone}`} />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  )
}
