interface SummaryMetricCardProps {
  label: string
  value: string
  description?: string
  /** @deprecated tone is no longer used - all KPIs use consistent neutral styling */
  tone?: string
}

export function SummaryMetricCard({
  label,
  value,
  description,
}: SummaryMetricCardProps) {
  return (
    <div className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {description && <small>{description}</small>}
    </div>
  )
}
