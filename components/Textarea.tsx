import { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-xs font-mono font-medium text-obsidian-400 tracking-wider uppercase">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3
            bg-obsidian-800/50
            border rounded-xl
            text-obsidian-100 font-mono
            placeholder-obsidian-500
            focus:outline-none focus:border-cyan-glow/50 focus:bg-obsidian-800
            focus:shadow-[0_0_20px_rgba(0,240,255,0.1)]
            transition-all duration-300 resize-none
            ${error ? 'border-danger-glow/50' : 'border-obsidian-600'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-danger-glow" />
            <p className="text-sm font-mono text-danger-glow">{error}</p>
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
