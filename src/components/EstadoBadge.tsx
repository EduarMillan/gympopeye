import type { EstadoSocio } from '../db/calculos'

/** Acento metálico (clase is-*), barra lateral y aro de foto por estado. */
export const estadoEstilo: Record<
  EstadoSocio,
  { card: string; barra: string; ring: string }
> = {
  al_dia: { card: 'is-ok', barra: 'bg-tertiary', ring: 'ring-tertiary/70' },
  por_vencer: {
    card: 'is-warn',
    barra: 'bg-secondary-dim',
    ring: 'ring-secondary-dim/70',
  },
  vencido: { card: 'is-danger', barra: 'bg-error', ring: 'ring-error/70' },
  sin_pagos: { card: 'is-danger', barra: 'bg-error', ring: 'ring-error/70' },
}

const estilos: Record<EstadoSocio, { clase: string; texto: string }> = {
  al_dia: { clase: 'bg-tertiary-container text-on-tertiary', texto: 'Al día' },
  por_vencer: {
    clase: 'bg-secondary-container text-on-secondary',
    texto: 'Por vencer',
  },
  vencido: {
    clase: 'bg-error-container text-on-error-container',
    texto: 'Vencido',
  },
  sin_pagos: {
    clase: 'border-2 border-outline-variant text-on-surface-variant',
    texto: 'Sin pagos',
  },
}

export default function EstadoBadge({ estado }: { estado: EstadoSocio }) {
  const { clase, texto } = estilos[estado]
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-label-sm font-semibold uppercase tracking-wide ${clase}`}
    >
      {texto}
    </span>
  )
}
