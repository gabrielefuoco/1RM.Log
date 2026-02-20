"use client"

import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Trophy } from "lucide-react"
import { useTranslations } from "next-intl"

interface PRUpdate {
    exerciseName: string
    old1Rm: number
    new1Rm: number
}

interface PRConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    updates: PRUpdate[]
    onConfirm: () => void
    onCancel: () => void
}

export function PRConfirmationDialog({
    open,
    onOpenChange,
    updates,
    onConfirm,
    onCancel
}: PRConfirmationDialogProps) {
    const t = useTranslations("Workout")
    if (updates.length === 0) return null

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-card border-t border-border">
                <div className="mx-auto w-full max-w-md">
                    <DrawerHeader className="text-center">
                        <div className="mx-auto bg-amber-500/10 p-3 rounded-full w-fit mb-2">
                            <Trophy className="h-6 w-6 text-amber-500" />
                        </div>
                        <DrawerTitle className="text-xl font-black uppercase tracking-widest">
                            {t("newRecords")}
                        </DrawerTitle>
                        <DrawerDescription className="text-muted-foreground">
                            {t("prDescription", { count: updates.length })}
                        </DrawerDescription>
                    </DrawerHeader>

                    <ScrollArea className="max-h-[200px] px-4 pr-6">
                        <div className="space-y-3">
                            {updates.map((update, i) => (
                                <div key={i} className="flex items-center justify-between bg-muted/50 border border-border p-3 rounded-xl">
                                    <div className="font-bold text-sm truncate max-w-[150px]">
                                        {update.exerciseName}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-mono">
                                        <span className="text-muted-foreground line-through decoration-foreground/20">
                                            {update.old1Rm}kg
                                        </span>
                                        <span className="text-muted-foreground/50">→</span>
                                        <span className="text-primary font-black text-lg">
                                            {update.new1Rm}kg
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <DrawerFooter className="flex-col gap-2">
                        <Button
                            onClick={onConfirm}
                            className="w-full h-12 bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider rounded-xl hover:bg-primary/90"
                        >
                            <Check className="mr-2 h-4 w-4" /> {t("updateAll")}
                        </Button>
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="w-full h-12 bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground font-bold rounded-xl"
                        >
                            {t("notNow")}
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
