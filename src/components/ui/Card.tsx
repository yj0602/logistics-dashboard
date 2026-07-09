import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  action?: ReactNode
}

export function Card({ title, action, className = '', children, ...props }: CardProps) {
  return (
    <section className={`card ${className}`} {...props}>
      {(title || action) && (
        <div className="card-header">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
