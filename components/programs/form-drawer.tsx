"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer"

interface FormDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    trigger?: ReactNode
    children: ReactNode
    submitLabel: string
    loadingLabel?: string
    loading?: boolean
    disabled?: boolean
    onSubmit: () => void
}

export function FormDrawer({
    open,
    onOpenChange,
    title,
    description,
    trigger,
    children,
    submitLabel,
    loadingLabel,
    loading = false,
    disabled = false,
    onSubmit,
}: FormDrawerProps) {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent className="bg-background border-t border-border">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">{title}</DrawerTitle>
                        {description && <DrawerDescription>{description}</DrawerDescription>}
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        {children}
                    </div>

                    <DrawerFooter>
                        <Button
                            onClick={onSubmit}
                            disabled={loading || disabled}
                            className="w-full bg-primary text-background-dark font-bold hover:bg-primary/90"
                        >
                            {loading ? (loadingLabel || submitLabel) : submitLabel}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full border-border text-white hover:bg-white/5 hover:text-white">
                                Annulla
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
