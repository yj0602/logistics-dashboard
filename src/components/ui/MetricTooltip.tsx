import { useEffect, useRef, useState } from 'react'

interface TooltipItem {
  label: string
  value: string | number
}

interface MetricTooltipProps {
  items: TooltipItem[]
  children: React.ReactNode
}

export function MetricTooltip({ items, children }: MetricTooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setVisible(true), 200)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setVisible(false), 100)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  if (items.length === 0) return <>{children}</>

  return (
    <div
      className="metric-tooltip-wrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      {children}
      {visible && (
        <div className="metric-tooltip" role="tooltip">
          <ul className="metric-tooltip-list">
            {items.map((item) => (
              <li key={item.label}>
                <span className="metric-tooltip-label">{item.label}</span>
                <span className="metric-tooltip-value">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
