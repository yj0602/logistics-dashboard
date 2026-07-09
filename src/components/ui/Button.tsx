import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({
  className = '',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return <button className={`btn btn-${variant} ${className}`} {...props} />
}
