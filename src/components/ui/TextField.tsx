import { useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const fieldBase =
  'w-full rounded border-2 border-surface-variant bg-surface-container-low px-3 py-2.5 ' +
  'text-on-surface placeholder:text-on-surface-variant/50 outline-none ' +
  'focus:border-primary-container transition-colors'

const labelClass =
  'flex flex-col gap-1.5 text-label-lg font-semibold uppercase tracking-wide text-on-surface-variant'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function TextField({ label, className = '', ...rest }: InputProps) {
  return (
    <label className={labelClass}>
      {label}
      <input className={`${fieldBase} font-body normal-case ${className}`} {...rest} />
    </label>
  )
}

/** Campo de contraseña con botón de ojito para ver/ocultar. */
export function PasswordField({ label, className = '', ...rest }: InputProps) {
  const [ver, setVer] = useState(false)
  return (
    <label className={labelClass}>
      {label}
      <div className="relative">
        <input
          type={ver ? 'text' : 'password'}
          className={`${fieldBase} font-body normal-case pr-11 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? 'Ocultar contraseña' : 'Ver contraseña'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant active:scale-90"
        >
          {ver ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }

export function TextArea({ label, className = '', ...rest }: AreaProps) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        className={`${fieldBase} font-body normal-case resize-none ${className}`}
        rows={3}
        {...rest}
      />
    </label>
  )
}
