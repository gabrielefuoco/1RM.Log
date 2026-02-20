"use client"

import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

interface ConfirmDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string | React.ReactNode
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    loading?: boolean
    variant?: "destructive" | "primary"
    children?: React.ReactNode
}

export function ConfirmDrawer({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Conferma",
    cancelLabel = "Annulla",
    onConfirm,
    loading = false,
    variant = "primary",
    children,
}: ConfirmDrawerProps) {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-background border-t border-border">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-foreground text-xl">{title}</DrawerTitle>
                        {description && (
                            <DrawerDescription className="text-slate-400">
                                {description}
                            </DrawerDescription>
                        )}
                    </DrawerHeader>

                    {children && <div className="px-4">{children}</div>}

                    <DrawerFooter>
                        <Button
                            onClick={(e) => {
                                e.preventDefault()
                                onConfirm()
                            }}
                            disabled={loading}
                            className={
                                variant === "destructive"
                                    ? "w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                                    : "w-full bg-primary text-background-dark font-bold hover:bg-primary/90"
                            }
                        >
                            {confirmLabel}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full border-border hover:bg-muted">
                                {cancelLabel}
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
