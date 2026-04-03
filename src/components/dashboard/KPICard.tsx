import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "highlight" | "success";
  size?: "normal" | "large";
  delay?: number;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  variant = "default",
  size = "normal",
  delay = 0
}: KPICardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        variant === "highlight" && "bg-gradient-to-br from-primary/5 via-card to-card border-primary/20",
        variant === "success" && "bg-gradient-to-br from-success/5 via-card to-card border-success/20",
        variant === "default" && "bg-card border-border/50",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("p-6", size === "large" && "p-8")}>
        {/* Header with icon and trend */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "rounded-xl flex items-center justify-center",
            size === "large" ? "w-14 h-14" : "w-12 h-12",
            variant === "highlight" && "bg-primary/10 text-primary",
            variant === "success" && "bg-success/10 text-success",
            variant === "default" && "bg-muted text-muted-foreground"
          )}>
            <Icon className={cn(size === "large" ? "w-7 h-7" : "w-6 h-6")} />
          </div>

          {trend && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                trendUp
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {trendUp && <TrendingUp className="h-3 w-3" />}
              {trend}
            </div>
          )}
        </div>

        {/* Value */}
        <h3 className={cn(
          "font-bold text-foreground tracking-tight",
          size === "large" ? "text-4xl" : "text-3xl"
        )}>
          {value}
        </h3>

        {/* Title */}
        <p className={cn(
          "text-muted-foreground mt-1",
          size === "large" ? "text-base" : "text-sm"
        )}>
          {title}
        </p>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-2">
            {subtitle}
          </p>
        )}
      </div>

      {/* Decorative gradient */}
      {variant === "highlight" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary opacity-60" />
      )}
      {variant === "success" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-success opacity-60" />
      )}
    </div>
  );
}
