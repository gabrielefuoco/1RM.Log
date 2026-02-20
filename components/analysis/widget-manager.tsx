"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings2 } from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface WidgetConfig {
    id: string
    title: string
    visible: boolean
}

interface WidgetManagerProps {
    config: WidgetConfig[]
    onToggle: (id: string) => void
}

export function WidgetManager({ config, onToggle }: WidgetManagerProps) {
    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-mono uppercase">
                    <Settings2 className="size-4" />
                    Personalizza
                </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background border-t border-border">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="font-heading uppercase tracking-widest text-primary">Gestione Widget</DrawerTitle>
                        <DrawerDescription className="text-muted-foreground text-xs uppercase font-mono">
                            Seleziona quali moduli visualizzare nella dashboard.
                        </DrawerDescription>
                    </DrawerHeader>
                    <ScrollArea className="h-[50vh] px-4 pr-6">
                        <div className="space-y-4">
                            {config.map((widget) => (
                                <div key={widget.id} className="flex items-center justify-between p-3 border border-border/20 rounded-lg bg-background/50">
                                    <span className="text-sm font-medium">{widget.title}</span>
                                    <Switch
                                        checked={widget.visible}
                                        onCheckedChange={() => onToggle(widget.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
