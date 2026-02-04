"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings2 } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
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
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-mono uppercase">
                    <Settings2 className="size-4" />
                    Personalizza
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card border-l border-border/50 w-[350px]">
                <SheetHeader>
                    <SheetTitle className="font-heading uppercase tracking-widest text-primary">Gestione Widget</SheetTitle>
                    <SheetDescription className="text-muted-foreground text-xs uppercase font-mono">
                        Seleziona quali moduli visualizzare nella dashboard.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
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
            </SheetContent>
        </Sheet>
    )
}
