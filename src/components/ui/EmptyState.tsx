import type { LucideIcon } from 'lucide-react'

type Props = {
  Icon: LucideIcon
  title: string
  desc?: string
}

export default function EmptyState({ Icon, title, desc }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
        <Icon size={32} strokeWidth={2} />
      </span>
      <p className="font-headline text-headline-md uppercase text-on-surface-variant">
        {title}
      </p>
      {desc && <p className="text-body-md text-on-surface-variant/70">{desc}</p>}
    </div>
  )
}
