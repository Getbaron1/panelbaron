import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor?: string
}

export function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor = 'text-primary' }: StatsCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn(
              'text-xs mt-2',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-destructive',
              changeType === 'neutral' && 'text-muted-foreground'
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl bg-primary/10', iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <div className={cn('bg-card rounded-2xl border border-border/50 p-6 shadow-card animate-fade-in', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
