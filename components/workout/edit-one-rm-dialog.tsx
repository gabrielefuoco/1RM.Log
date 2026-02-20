"use client"

import { useState, useEffect } from "react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { getUserOneRm, upsertUserOneRm, deleteUserOneRm } from "@/services/one-rm"
import { useTranslations } from "next-intl"

interface EditOneRmDialogProps {
    exerciseId: string
    exerciseName: string
    history1RM: number
    onUpdate: () => void
    trigger?: React.ReactNode
}

export function EditOneRmDialog({ exerciseId, exerciseName, history1RM, onUpdate, trigger }: EditOneRmDialogProps) {
    const t = useTranslations("Workout")
    const [open, setOpen] = useState(false)
    const [manualOneRm, setManualOneRm] = useState<number | undefined>(undefined)
    const [loading, setLoading] = useState(false)
    const [isOverrideActive, setIsOverrideActive] = useState(false)

    useEffect(() => {
        if (open) {
            loadOneRm()
        }
    }, [open, exerciseId])

    const loadOneRm = async () => {
        setLoading(true)
        try {
            const data = await getUserOneRm(exerciseId)
            if (data && data.one_rm > 0) {
                setManualOneRm(data.one_rm)
                setIsOverrideActive(true)
            } else {
                setManualOneRm(undefined)
                setIsOverrideActive(false)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!manualOneRm || manualOneRm <= 0) {
            toast.error(t("invalidValue"))
            return
        }
        setLoading(true)
        try {
            await upsertUserOneRm(exerciseId, manualOneRm)
            toast.success(t("saved"))
            setOpen(false)
            onUpdate()
        } catch (error) {
            toast.error(t("saveError"))
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = async () => {
        setLoading(true)
        try {
            await deleteUserOneRm(exerciseId)
            toast.success(t("restored"))
            setManualOneRm(undefined)
            setIsOverrideActive(false)
            setOpen(false)
            onUpdate()
        } catch (error) {
            toast.error(t("restoreError"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground gap-1">
                        <Trophy className="h-3 w-3" />
                        {isOverrideActive ? t("override") : t("historical")}
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="bg-background border-t border-border">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="flex items-center gap-2 text-foreground text-xl">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            {t("manage1rm")}
                        </DrawerTitle>
                    </DrawerHeader>

                    <div className="p-4 space-y-6">
                        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("exercise")}</span>
                            <p className="font-bold text-lg">{exerciseName}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">{t("bestHistorical")}</Label>
                                <div className="h-10 flex items-center px-3 rounded-md bg-muted/50 border border-transparent font-mono font-bold text-muted-foreground">
                                    {history1RM > 0 ? history1RM : "-"} kg
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-amber-500 font-bold">{t("manualOverride")}</Label>
                                <Input
                                    type="number"
                                    value={manualOneRm || ''}
                                    onChange={(e) => setManualOneRm(Number(e.target.value))}
                                    className="font-bold font-mono text-amber-500 border-amber-500/20 focus:border-amber-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <Button onClick={handleSave} disabled={loading} className="w-full gap-2 font-bold bg-amber-500 hover:bg-amber-600 text-black">
                                <Save className="h-4 w-4" />
                                {t("saveManually")}
                            </Button>

                            {isOverrideActive && (
                                <Button onClick={handleReset} variant="outline" disabled={loading} className="w-full gap-2 text-muted-foreground">
                                    <RotateCcw className="h-4 w-4" />
                                    {t("restoreHistorical")}
                                </Button>
                            )}
                        </div>

                        <p className="text-[10px] text-muted-foreground text-center px-4 leading-tight">
                            {t("overrideNotice")}
                        </p>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
