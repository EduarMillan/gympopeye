import type { SelectHTMLAttributes, ReactNode } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  children: ReactNode
}

export function SelectField({ label, className = '', children, ...rest }: Props) {
  return (
    <label className="flex flex-col gap-1.5 text-label-lg font-semibold uppercase tracking-wide text-on-surface-variant">
      {label}
      <select
        className={
          'w-full rounded border-2 border-surface-variant bg-surface-container-low px-3 py-2.5 ' +
          'font-body normal-case text-on-surface outline-none focus:border-primary-container ' +
          `transition-colors ${className}`
        }
        {...rest}
      >
        {children}
      </select>
    </label>
  )
}
