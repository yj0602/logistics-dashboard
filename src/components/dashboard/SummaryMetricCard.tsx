type MetricVariant = 'default' | 'success' | 'info' | 'danger' | 'warning'

interface SummaryMetricCardProps {
  label: string
  value: string
  description?: string
  variant?: MetricVariant
}

export function SummaryMetricCard({
  label,
  value,
  description,
  variant = 'default',
}: SummaryMetricCardProps) {
  return (
    <div className={`metric-card${variant !== 'default' ? ` metric-${variant}` : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {description && <small>{description}</small>}
    </div>
  )
}
