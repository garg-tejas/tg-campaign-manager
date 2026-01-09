interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variants = {
  primary: `
    bg-gradient-to-r from-cyan-glow/90 to-cyan-dim
    hover:from-cyan-glow hover:to-cyan-glow/80
    text-obsidian-950 font-semibold
    shadow-[0_0_20px_rgba(0,240,255,0.3),0_4px_12px_rgba(0,0,0,0.4)]
    hover:shadow-[0_0_30px_rgba(0,240,255,0.5),0_6px_20px_rgba(0,0,0,0.4)]
    border border-cyan-glow/50
  `,
  secondary: `
    bg-obsidian-700 hover:bg-obsidian-600
    text-obsidian-100
    border border-obsidian-500 hover:border-obsidian-400
    shadow-[0_4px_12px_rgba(0,0,0,0.3)]
  `,
  danger: `
    bg-gradient-to-r from-danger-glow/90 to-danger-glow/70
    hover:from-danger-glow hover:to-danger-glow/80
    text-white font-semibold
    shadow-[0_0_20px_rgba(255,51,102,0.3),0_4px_12px_rgba(0,0,0,0.4)]
    hover:shadow-[0_0_30px_rgba(255,51,102,0.5),0_6px_20px_rgba(0,0,0,0.4)]
    border border-danger-glow/50
  `,
  ghost: `
    bg-transparent hover:bg-obsidian-700/50
    text-obsidian-300 hover:text-cyan-glow
    border border-transparent hover:border-obsidian-600
  `,
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 gap-2',
  lg: 'px-7 py-3.5 text-lg gap-2.5',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-300 ease-out
        transform hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100
        focus-ring
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
