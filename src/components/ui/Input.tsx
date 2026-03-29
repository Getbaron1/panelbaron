import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-10 px-4 bg-muted/50 border border-border/50 rounded-xl text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
            'placeholder:text-muted-foreground transition-all',
            error && 'border-destructive focus:ring-destructive/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
