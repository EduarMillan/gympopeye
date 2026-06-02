import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  Icon: LucideIcon
  action?: ReactNode
}

export default function PageHeader({ title, Icon, action }: Props) {
  return (
    <header className="mb-5 flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded bg-surface-container-high text-primary">
        <Icon size={24} strokeWidth={2} />
      </span>
      <h2 className="flex-1 font-headline text-headline-md uppercase">{title}</h2>
      {action}
    </header>
  )
}
