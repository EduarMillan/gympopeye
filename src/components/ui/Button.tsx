import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded font-body font-bold uppercase tracking-wide ' +
  'px-4 py-2.5 text-label-lg transition-transform active:scale-95 disabled:opacity-40 ' +
  'disabled:pointer-events-none select-none'

const variants: Record<Variant, string> = {
  primary: 'btn-red',
  outline: 'border-2 border-secondary text-secondary',
  ghost: 'text-on-surface-variant',
  danger: 'border-2 border-error text-error',
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
