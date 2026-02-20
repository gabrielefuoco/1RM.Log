"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Scale,
    ChevronLeft,
    Trash2,
    TrendingDown,
    TrendingUp,
    Minus,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useBodyweight } from "@/hooks/use-bodyweight"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts"
import { format, subDays, startOfDay } from "date-fns"
import { it, enUS } from "date-fns/locale"
import { useTranslations, useLocale } from "next-intl"
import { useHeader } from "@/components/header-provider"
import { useEffect } from "react"

export default function BodyweightPage() {
    const t = useTranslations("Bodyweight")
    const locale = useLocale()
    const router = useRouter()
    const { history, latest, addWeight, deleteWeight, isAdding, isLoading } = useBodyweight()
    const { setHeader } = useHeader()
    const [newWeight, setNewWeight] = useState("")

    useEffect(() => {
        setHeader({
            title: t("title"),
            subtitle: t("subtitle")
        })
    }, [t])

    const handleAdd = async () => {
        if (!newWeight || isAdding) return
        const weight = parseFloat(newWeight)
        if (isNaN(weight)) return

        await addWeight({ weight })
        setNewWeight("")
    }

    const stats = {
        current: latest?.weight || 0,
        start: history[history.length - 1]?.weight || 0,
        min: history.length ? Math.min(...history.map(h => h.weight)) : 0,
        max: history.length ? Math.max(...history.map(h => h.weight)) : 0,
        change: history.length >= 2 ? (latest?.weight || 0) - (history[history.length - 1]?.weight || 0) : 0
    }

    const dateLocale = locale === 'it' ? it : enUS

    const chartData = [...history].reverse().map(log => ({
        weight: log.weight,
        date: format(new Date(log.date), "d MMM", { locale: dateLocale }),
        fullDate: format(new Date(log.date), "dd/MM/yyyy")
    }))

    return (
        <div className="space-y-6 pt-4 pb-24">
            {/* Action Bar */}
            <div className="flex items-center gap-4 pt-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full bg-secondary/20 h-10 w-10"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/50">
                    <CardContent className="pt-4 px-4 pb-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("current")}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-heading font-black tracking-tight text-foreground">{stats.current.toFixed(1)}</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase">kg</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50">
                    <CardContent className="pt-4 px-4 pb-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("variation")}</p>
                        <div className="flex items-center gap-1">
                            <span className={`text-2xl font-heading font-black tracking-tight ${stats.change <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground uppercase">kg</span>
                            {stats.change < 0 ? <ArrowDownRight className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50">
                    <CardContent className="pt-4 px-4 pb-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("min")}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-heading font-black tracking-tight text-foreground">{stats.min.toFixed(1)}</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase">kg</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50">
                    <CardContent className="pt-4 px-4 pb-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("max")}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-heading font-black tracking-tight text-foreground">{stats.max.toFixed(1)}</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase">kg</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart Card */}
            <Card className="border-border/50 overflow-hidden">
                <CardHeader className="border-b border-border/10 bg-secondary/5 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-heading font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-primary" />
                            {t("trendTitle")}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis
                                    hide
                                    domain={['dataMin - 2', 'dataMax + 2']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#111',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="var(--color-primary)"
                                    fillOpacity={1}
                                    fill="url(#colorWeight)"
                                    strokeWidth={3}
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Input & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Card */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold tracking-tight uppercase">{t("newEntry")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Scale className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="number"
                                step="0.1"
                                placeholder="82.5"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                className="pl-10 h-10 text-lg font-bold"
                            />
                        </div>
                        <Button
                            className="w-full font-black tracking-widest uppercase"
                            onClick={handleAdd}
                            disabled={!newWeight || isAdding}
                        >
                            {isAdding ? t("saving") : t("saveWeight")}
                        </Button>
                    </CardContent>
                </Card>

                {/* History List */}
                <Card className="lg:col-span-2 border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold tracking-tight uppercase">{t("historyLogs")}</CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("entries", { count: history.length })}</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/10">
                            {history.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Scale className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">{t("noLogs")}</p>
                                </div>
                            ) : (
                                history.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-4 hover:bg-secondary/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black tracking-tight">{log.weight.toFixed(1)} <span className="text-xs text-muted-foreground">kg</span></p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    {format(new Date(log.date), "eeee d MMMM yyyy", { locale: dateLocale })}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-red-500"
                                            onClick={() => deleteWeight(log.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
