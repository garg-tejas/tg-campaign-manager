interface StatusBadgeProps {
  status: string
  className?: string
}

const statusStyles: Record<string, { bg: string; text: string; border: string; glow?: string }> = {
  // Campaign statuses
  draft: {
    bg: 'bg-obsidian-600/20',
    text: 'text-obsidian-400',
    border: 'border-obsidian-500/30',
  },
  scheduled: {
    bg: 'bg-cyan-glow/10',
    text: 'text-cyan-glow',
    border: 'border-cyan-glow/30',
    glow: 'shadow-[0_0_10px_rgba(0,240,255,0.15)]',
  },
  sending: {
    bg: 'bg-amber-glow/10',
    text: 'text-amber-glow',
    border: 'border-amber-glow/30',
    glow: 'shadow-[0_0_10px_rgba(255,184,0,0.15)]',
  },
  completed: {
    bg: 'bg-success-glow/10',
    text: 'text-success-glow',
    border: 'border-success-glow/30',
    glow: 'shadow-[0_0_10px_rgba(0,255,136,0.15)]',
  },
  failed: {
    bg: 'bg-danger-glow/10',
    text: 'text-danger-glow',
    border: 'border-danger-glow/30',
    glow: 'shadow-[0_0_10px_rgba(255,51,102,0.15)]',
  },
  // Message statuses
  pending: {
    bg: 'bg-obsidian-600/20',
    text: 'text-obsidian-400',
    border: 'border-obsidian-500/30',
  },
  sent: {
    bg: 'bg-success-glow/10',
    text: 'text-success-glow',
    border: 'border-success-glow/30',
    glow: 'shadow-[0_0_10px_rgba(0,255,136,0.15)]',
  },
  deleted: {
    bg: 'bg-obsidian-600/20',
    text: 'text-obsidian-400',
    border: 'border-obsidian-500/30',
  },
  delete_failed: {
    bg: 'bg-amber-glow/10',
    text: 'text-amber-glow',
    border: 'border-amber-glow/30',
    glow: 'shadow-[0_0_10px_rgba(255,184,0,0.15)]',
  },
  // Channel statuses
  active: {
    bg: 'bg-success-glow/10',
    text: 'text-success-glow',
    border: 'border-success-glow/30',
    glow: 'shadow-[0_0_10px_rgba(0,255,136,0.15)]',
  },
  inactive: {
    bg: 'bg-obsidian-600/20',
    text: 'text-obsidian-400',
    border: 'border-obsidian-500/30',
  },
}

const defaultStyle = statusStyles.draft

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = statusStyles[status] || defaultStyle

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
        text-[10px] font-mono font-medium tracking-wider uppercase
        border backdrop-blur-sm
        ${style.bg} ${style.text} ${style.border} ${style.glow || ''}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.text.replace('text-', 'bg-')}`} />
      {status.replace('_', ' ')}
    </span>
  )
}
