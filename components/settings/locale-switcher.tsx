"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/routing"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

export function LocaleSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    function onSelectChange(nextLocale: string) {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale as any })
        })
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectChange(locale === "it" ? "en" : "it")}
            disabled={isPending}
            className="flex items-center gap-2 group"
        >
            <Languages className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-bold uppercase tracking-tight">
                {locale === "it" ? "English" : "Italiano"}
            </span>
        </Button>
    )
}
