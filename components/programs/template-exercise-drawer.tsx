"use client"

import { useState, useEffect, useMemo } from "react"
import { getExercises, addTemplateExercise, updateTemplateExercise } from "@/services/exercises"
import { Exercise } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Search, Dumbbell, Plus } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useTemplateSetEditor } from "@/hooks/use-template-set-editor"
import { TemplateSetForm } from "./template-set-form"
import { toast } from "sonner"

interface TemplateExerciseDrawerProps {
    mode: 'add' | 'edit'
    templateId?: string
    currentExercisesCount?: number
    templateExercise?: any // The template_exercise row with .exercise joined
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess: () => void
    trigger?: React.ReactNode
}

export function TemplateExerciseDrawer({
    mode,
    templateId,
    currentExercisesCount = 0,
    templateExercise,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
    onSuccess,
    trigger
}: TemplateExerciseDrawerProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [internalOpen, setInternalOpen] = useState(false)
    const open = externalOpen ?? internalOpen
    const onOpenChange = externalOnOpenChange ?? setInternalOpen

    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
    const [activeTab, setActiveTab] = useState<'sets' | 'progression'>('sets')

    const editor = useTemplateSetEditor({
        initialSets: templateExercise?.sets_data,
        initialTargetRir: templateExercise?.target_rir,
        initialProgressionMode: templateExercise?.progression_mode,
        initialProgressionConfig: templateExercise?.progression_config
    })

    // Sync selected exercise in edit mode
    useEffect(() => {
        if (mode === 'edit' && templateExercise?.exercise) {
            setSelectedExercise(templateExercise.exercise)
        }
    }, [mode, templateExercise])

    // Load exercises for search
    useEffect(() => {
        if (open && mode === 'add' && !selectedExercise) {
            getExercises().then(setExercises)
        }
    }, [open, mode, selectedExercise])

    const filteredExercises = useMemo(() => {
        return exercises.filter(e =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [exercises, searchQuery])

    const handleSubmit = async () => {
        if (!selectedExercise) return
        if (mode === 'add' && !templateId) return
        if (mode === 'edit' && !templateExercise?.id) return

        setLoading(true)
        try {
            const cleanSets = editor.getCleanSets()

            if (mode === 'add') {
                await addTemplateExercise({
                    workout_template_id: templateId!,
                    exercise_id: selectedExercise.id,
                    target_sets: cleanSets.length,
                    target_reps_min: -1,
                    target_reps_max: -1,
                    target_rir: editor.targetRir,
                    sets_data: cleanSets,
                    progression_mode: editor.progressionMode,
                    progression_config: editor.progressionConfig,
                    order: currentExercisesCount
                })
                toast.success("Esercizio aggiunto al template")
            } else {
                await updateTemplateExercise(templateExercise.id, {
                    target_sets: cleanSets.length,
                    target_reps_min: -1,
                    target_reps_max: -1,
                    target_rir: editor.targetRir,
                    sets_data: cleanSets,
                    progression_mode: editor.progressionMode,
                    progression_config: editor.progressionConfig
                })
                toast.success("Esercizio aggiornato")
            }

            onOpenChange(false)
            if (mode === 'add') {
                setSelectedExercise(null)
                setSearchQuery("")
            }
            onSuccess()
        } catch (error) {
            console.error(error)
            toast.error("Errore durante il salvataggio")
        } finally {
            setLoading(false)
        }
    }

    const Header = isDesktop ? DialogHeader : DrawerHeader
    const Title = isDesktop ? DialogTitle : DrawerTitle
    const Description = isDesktop ? DialogDescription : DrawerDescription
    const Footer = isDesktop ? DialogFooter : DrawerFooter

    const footerButtons = (
        <Footer className="p-6 pt-0 gap-3 sm:gap-0">
            {selectedExercise && (
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-primary text-zinc-950 font-black uppercase tracking-widest hover:bg-primary/90 h-12 rounded-lg text-sm shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all"
                >
                    {loading ? "Saving..." : (mode === 'add' ? "Add Exercise" : "Save Changes")}
                </Button>
            )}
            {!isDesktop && (
                <DrawerClose asChild>
                    <Button variant="ghost" className="w-full text-slate-500 text-xs uppercase font-bold">
                        Cancel
                    </Button>
                </DrawerClose>
            )}
        </Footer>
    )

    const contentBody = (
        <div className="flex flex-col h-full max-h-[90vh]">
            <Header className="p-6 pb-2 shrink-0">
                <Title className="text-2xl uppercase italic font-black tracking-tighter text-white">
                    {selectedExercise ? (mode === 'add' ? "Configure Exercise" : "Edit Configuration") : "Select Exercise"}
                </Title>
                <Description className="text-slate-400">
                    {selectedExercise
                        ? `Set targets for ${selectedExercise.name}`
                        : "Search and select from the database"}
                </Description>
            </Header>

            <div className="p-6 pt-2 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                {!selectedExercise ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search exercise..."
                                className="pl-10 bg-card/50 border-border text-white h-12 rounded-lg focus:border-primary/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2 pb-4">
                            {filteredExercises.map((exercise) => (
                                <button
                                    key={exercise.id}
                                    className={cn(
                                        "w-full p-3 rounded-lg text-left transition-all flex items-center gap-4 group",
                                        "bg-card/40 border border-border hover:bg-card/80 hover:border-primary/30"
                                    )}
                                    onClick={() => setSelectedExercise(exercise)}
                                >
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <Dumbbell className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white text-base truncate">{exercise.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{exercise.body_parts?.join(', ')}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-4 relative overflow-hidden shrink-0">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                                <Dumbbell className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 z-10 min-w-0">
                                <p className="text-lg font-black text-white leading-tight uppercase tracking-tight truncate">{selectedExercise.name}</p>
                                {mode === 'add' && (
                                    <button
                                        className="text-[10px] text-primary hover:text-primary/80 uppercase font-black tracking-widest mt-1"
                                        onClick={() => setSelectedExercise(null)}
                                    >
                                        Change Exercise
                                    </button>
                                )}
                            </div>
                        </div>

                        <TemplateSetForm
                            {...editor}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </>
                )}
            </div>
            {footerButtons}
        </div>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                    {trigger || (mode === 'add' && (
                        <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Exercise
                        </Button>
                    ))}
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-background/90 border border-border backdrop-blur-xl shadow-2xl p-0 overflow-hidden text-white flex flex-col">
                    {contentBody}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerTrigger asChild>
                {trigger || (mode === 'add' && (
                    <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Exercise
                    </Button>
                ))}
            </DrawerTrigger>
            <DrawerContent className="bg-background/95 border-t border-border max-h-[95vh] text-white">
                <div className="mx-auto w-full max-w-sm">
                    {contentBody}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
