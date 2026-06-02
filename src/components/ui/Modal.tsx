import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90svh] w-full max-w-2xl flex-col rounded-t-xl border-t-2 border-surface-variant bg-surface-container"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b-2 border-surface-variant px-5 py-4">
          <h2 className="font-headline text-headline-md uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant transition-transform active:scale-90"
            aria-label="Cerrar"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
