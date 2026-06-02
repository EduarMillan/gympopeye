import { Plus } from 'lucide-react'

type Props = {
  onClick: () => void
  label?: string
}

/** Botón flotante de acción (Floating Action Button). */
export default function Fab({ onClick, label = 'Agregar' }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="btn-red fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-90"
    >
      <Plus size={28} strokeWidth={3} />
    </button>
  )
}
