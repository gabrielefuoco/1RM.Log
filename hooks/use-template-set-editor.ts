import { useState, useCallback, useEffect } from "react"
import { TemplateSet, ProgressionMode } from "@/types/database"
import { calculatePercentFromRepsAndRir, estimateRIR } from "@/utils/formulas"

export interface ExtendedTemplateSet extends TemplateSet {
    _id: string
    _ui_mode?: 'fixed' | 'range'
    _ui_weight_mode?: 'percent' | 'absolute'
}

interface UseTemplateSetEditorProps {
    initialSets?: TemplateSet[]
    initialTargetRir?: number
    initialProgressionMode?: ProgressionMode
    initialProgressionConfig?: any
}

export function useTemplateSetEditor({
    initialSets,
    initialTargetRir,
    initialProgressionMode,
    initialProgressionConfig
}: UseTemplateSetEditorProps = {}) {
    const [targetRir, setTargetRir] = useState(initialTargetRir ?? 2)
    const [setsData, setSetsData] = useState<ExtendedTemplateSet[]>([])
    const [progressionMode, setProgressionMode] = useState<ProgressionMode>(initialProgressionMode ?? 'static')
    const [progressionConfig, setProgressionConfig] = useState<any>(initialProgressionConfig ?? {})

    // Initialize/Sync
    useEffect(() => {
        if (initialSets && initialSets.length > 0) {
            setSetsData(initialSets.map(s => ({
                ...s,
                _id: crypto.randomUUID(),
                _ui_mode: s.reps_min === s.reps_max ? 'fixed' : 'range',
                _ui_weight_mode: s.weight_absolute ? 'absolute' : 'percent'
            })))
        } else {
            // Default first set
            setSetsData([{
                _id: crypto.randomUUID(),
                reps_min: 8,
                reps_max: 8,
                rir: 2,
                type: 'straight',
                _ui_mode: 'fixed',
                _ui_weight_mode: 'percent'
            }])
        }
    }, [initialSets])

    useEffect(() => {
        if (initialTargetRir !== undefined) setTargetRir(initialTargetRir)
    }, [initialTargetRir])

    useEffect(() => {
        if (initialProgressionMode) setProgressionMode(initialProgressionMode)
    }, [initialProgressionMode])

    useEffect(() => {
        if (initialProgressionConfig) setProgressionConfig(initialProgressionConfig)
    }, [initialProgressionConfig])

    const updateSingleSet = useCallback((index: number, updates: Partial<ExtendedTemplateSet>) => {
        setSetsData(prev => {
            const next = [...prev]
            const currentSet = next[index]
            if (!currentSet) return prev

            const updatedSet = { ...currentSet, ...updates }

            // Handle UI Mode Switch Logic (Range vs Fixed)
            if (updates._ui_mode === 'range') {
                // Keep as is
            } else if (updates._ui_mode === 'fixed') {
                updatedSet.reps_max = updatedSet.reps_min
            }

            // Sync Min/Max if in Fixed Mode
            const isFixed = updatedSet._ui_mode === 'fixed' || (!updatedSet._ui_mode && updatedSet.reps_min === updatedSet.reps_max)
            if (isFixed && updates.reps_min !== undefined) {
                updatedSet.reps_max = updatedSet.reps_min
            }

            // Handle Backoff Toggle
            if (updates.is_backoff !== undefined) {
                if (updates.is_backoff) {
                    updatedSet._ui_weight_mode = 'percent'
                    updatedSet.weight_mode = 'percent'
                }
            }

            // Handle Weight Mode Switch
            if (updates._ui_weight_mode) {
                updatedSet._ui_weight_mode = updates._ui_weight_mode
                updatedSet.weight_mode = updates._ui_weight_mode
            }

            next[index] = updatedSet
            return next
        })
    }, [])

    const addSet = useCallback(() => {
        setSetsData(prev => {
            const lastSet = prev[prev.length - 1] || {
                reps_min: 8, reps_max: 8, rir: 2, type: 'straight',
                _ui_mode: 'fixed' as const, _ui_weight_mode: 'percent' as const
            }
            return [...prev, { ...lastSet, _id: crypto.randomUUID() }]
        })
    }, [])

    const removeSet = useCallback((index: number) => {
        setSetsData(prev => {
            if (prev.length <= 1) return prev
            return prev.filter((_, i) => i !== index)
        })
    }, [])

    const getCleanSets = useCallback(() => {
        return setsData.map(s => {
            const { _id, _ui_mode, _ui_weight_mode, ...rest } = s
            // Ensure consistency before saving
            if (rest.weight_absolute) rest.weight_mode = 'absolute'
            else if (rest.percentage || rest.backoff_percent) rest.weight_mode = 'percent'
            return rest
        })
    }, [setsData])

    const reorderSets = useCallback((startIndex: number, endIndex: number) => {
        setSetsData(prev => {
            const result = Array.from(prev)
            const [removed] = result.splice(startIndex, 1)
            result.splice(endIndex, 0, removed)
            return result
        })
    }, [])

    return {
        setsData,
        targetRir,
        setTargetRir,
        progressionMode,
        setProgressionMode,
        progressionConfig,
        setProgressionConfig,
        updateSingleSet,
        addSet,
        removeSet,
        reorderSets,
        getCleanSets
    }
}
