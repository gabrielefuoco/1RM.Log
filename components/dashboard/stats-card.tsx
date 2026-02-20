import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatsCardProps {
    title: string
    value: string
    subtitle: string
    icon: LucideIcon
    trend?: string
    isPositive?: boolean
    isLoading?: boolean
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, isPositive, isLoading }: StatsCardProps) {
    if (isLoading) {
        return (
            <Card className="h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-4">
                        <Skeleton className="w-9 h-9 rounded-md" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <div>
                        <Skeleton className="h-8 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full relative overflow-hidden group">
            <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-md bg-secondary/10 border border-primary/20 group-hover:border-primary/50 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-heading font-bold tracking-widest text-muted-foreground uppercase">{title}</span>
                </div>

                <div>
                    <h3 className="text-3xl font-mono font-bold text-foreground mb-1 leading-tight">{value}</h3>
                    <div className="flex justify-between items-end">
                        <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wide">{subtitle}</p>
                        {trend && (
                            <span className={cn(
                                "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                                isPositive
                                    ? 'text-primary bg-primary/10'
                                    : 'text-destructive bg-destructive/10'
                            )}>
                                {trend}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
