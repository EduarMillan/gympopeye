import { ChevronRight, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import type { EstadoSocio } from '../db/calculos'
import { estadoEstilo } from './EstadoBadge'

type Props = {
  nombre: string
  estado: EstadoSocio
  foto?: string
  subtitle?: ReactNode
  right?: ReactNode
  onClick: () => void
}

/** Tarjeta de socio reutilizable, coloreada según el estado de pago. */
export default function SocioCard({
  nombre,
  estado,
  foto,
  subtitle,
  right,
  onClick,
}: Props) {
  const e = estadoEstilo[estado]
  return (
    <button
      onClick={onClick}
      className={`group card-metal ${e.card} flex w-full items-stretch overflow-hidden transition active:scale-[0.99]`}
    >
      {/* Barra de color de estado */}
      <span className={`w-1.5 shrink-0 ${e.barra}`} />

      <span className="flex flex-1 items-center gap-3 overflow-hidden p-3 text-left">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high text-on-surface-variant ring-2 ${e.ring}`}
        >
          {foto ? (
            <img src={foto} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound size={22} />
          )}
        </span>

        <span className="flex-1 overflow-hidden">
          <span className="block truncate font-body text-body-lg font-semibold text-on-surface">
            {nombre}
          </span>
          {subtitle && (
            <span className="block truncate text-label-sm uppercase text-on-surface-variant">
              {subtitle}
            </span>
          )}
        </span>

        {right}

        <ChevronRight
          size={18}
          className="shrink-0 text-on-surface-variant/50 transition-transform group-active:translate-x-0.5"
        />
      </span>
    </button>
  )
}
