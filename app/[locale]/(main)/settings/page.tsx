"use client"

import { Button } from "@/components/ui/button"
import { useProfile } from "@/hooks/use-profile"
import { LogOut, Moon, Sun, User, Settings as SettingsIcon, ShieldAlert } from "lucide-react"
import { signOut } from "@/app/[locale]/(auth)/actions"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressionSettings } from "@/components/settings/progression-settings"
import { useTranslations } from "next-intl"
import { LocaleSwitcher } from "@/components/settings/locale-switcher"

export default function SettingsPage() {
    const { data: profile, isLoading } = useProfile()
    const { setTheme, theme } = useTheme()
    const t = useTranslations("Settings")

    const handleLogout = async () => {
        await signOut()
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>

            {/* Profile Card */}
            <Card className="border-primary/20 bg-zinc-900/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {t("profile")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        {isLoading ? (
                            <Skeleton className="h-16 w-16 rounded-full" />
                        ) : (
                            <Avatar className="h-16 w-16 border-2 border-primary">
                                <AvatarImage src={profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                                    {getInitials(profile?.full_name)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <div className="space-y-1">
                            {isLoading ? (
                                <>
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </>
                            ) : (
                                <>
                                    <h3 className="font-bold text-lg leading-none">{profile?.full_name || t("athlete")}</h3>
                                    <p className="text-sm text-muted-foreground">{profile?.email || "email@example.com"}</p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Progression Settings */}
            <ProgressionSettings />

            {/* Appearance & Locale */}
            <Card className="border-white/5 bg-zinc-900/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-slate-400" />
                        {t("app")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-medium text-sm text-slate-200">{t("theme")}</h4>
                            <p className="text-xs text-muted-foreground">{t("themeDescription")}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="rounded-full"
                        >
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-500" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="space-y-0.5">
                            <h4 className="font-medium text-sm text-slate-200">{t("language")}</h4>
                            <p className="text-xs text-muted-foreground">{t("languageDescription")}</p>
                        </div>
                        <LocaleSwitcher />
                    </div>
                </CardContent>
            </Card>

            {/* Account Management */}
            <Card className="border-white/5 bg-zinc-900/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-slate-400" />
                        {t("account")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 font-bold"
                    >
                        <LogOut className="h-4 w-4" />
                        {t("logout")}
                    </Button>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground pt-10">
                <p>{t("version")}</p>
                <p>{t("footer")}</p>
            </div>
        </div>
    )
}
