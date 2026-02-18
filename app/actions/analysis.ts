'use server'

import { createClient } from "@/lib/supabase/server"
import { calculateDOTS } from "@/utils/formulas"
import { getProgressionSettings } from "@/services/progression"
import { SmartChartConfig, SmartChartMetric } from "@/types/analysis"

// --- Unified Data Action ---

export async function getSmartChartData(config: SmartChartConfig) {
    // Normalize exerciseIds: ensure it's an array and handles legacy exerciseId
    const baseIds = config.params.exerciseIds || []
    // Combine with legacy single exerciseId if present and not already in baseIds
    const legacyId = (config.params as any).exerciseId
    if (legacyId && !baseIds.includes(legacyId)) {
        baseIds.push(legacyId);
    }
    let exerciseIds = Array.from(new Set(baseIds.filter(Boolean)))

    // Fallback for 1RM if no exercise selected: pick the one with best progression
    if (config.metric === '1rm' && exerciseIds.length === 0) {
        const bestId = await getBestProgressionExerciseId(config.params.periodDays)
        if (bestId) exerciseIds = [bestId]
    }

    const isMulti = exerciseIds.length > 1

    switch (config.metric) {
        case '1rm':
            if (isMulti) return getMultiExerciseTrend(exerciseIds, config.params.periodDays, '1rm')
            return get1RMTrend(exerciseIds[0] || '', config.params.periodDays)
        case 'rel_strength':
            if (isMulti) return getMultiExerciseTrend(exerciseIds, config.params.periodDays, 'rel_strength')
            return getRelativeStrengthTrend(exerciseIds[0] || '', config.params.periodDays)
        case 'volume':
            return getVolumeStats(config.params.periodDays)
        case 'sbd':
            return getSBD1RMTrend(config.params.periodDays, config.params)
        case 'normalized':
            return getNormalizedMultiTrend(exerciseIds, config.params.periodDays)
        case 'muscle_balance':
            return getMuscleBalance(config.params.periodDays)
        case 'muscle_volume':
            return getVolumeByBodyPart(config.params.periodDays)
        case 'bodyweight':
            return getBodyweightTrend(config.params.periodDays)
        case 'dots':
            return getCompetitionPointsTrend(config.params.periodDays, config.params)
        case 'hard_sets':
            return getHardSetsTrend(config.params.periodDays)
        case 'fatigue':
            return getFatigueScatter(config.params.periodDays)
        case 'intensity':
            return getIntensityDistribution(config.params.periodDays)
        default:
            return []
    }
}

/**
 * Finds the exercise with the highest % progression in the last period.
 */
async function getBestProgressionExerciseId(periodDays: number = 90): Promise<string | null> {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select('exercise_id, estimated_1rm, workout_sessions!inner(date)')
        .gte('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    if (!logs || logs.length === 0) return null

    const stats: Record<string, { first: number, last: number }> = {}

    logs.forEach(log => {
        const id = log.exercise_id
        const val = Number(log.estimated_1rm)
        if (!stats[id]) {
            stats[id] = { first: val, last: val }
        } else {
            stats[id].last = val
        }
    })

    let bestId: string | null = null
    let maxProgression = -Infinity

    Object.entries(stats).forEach(([id, s]) => {
        if (s.first > 0) {
            const prog = (s.last - s.first) / s.first
            if (prog > maxProgression) {
                maxProgression = prog
                bestId = id
            }
        }
    })

    return bestId
}

/**
 * Generalized multi-exercise trend (Absolute values, not normalized)
 */
export async function getMultiExerciseTrend(exerciseIds: string[], periodDays: number = 90, metric: '1rm' | 'rel_strength') {
    if (!exerciseIds.length) return { points: [], names: {} }
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Fetch all logs for these exercises
    const { data: logs } = await supabase
        .from('exercise_logs')
        .select(`
            estimated_1rm,
            exercise_id,
            exercises!inner(name),
            workout_sessions!inner(date)
        `)
        .in('exercise_id', exerciseIds)
        .gte('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    if (!logs || logs.length === 0) return { points: [], names: {} }

    // If relative strength, we need bodyweight logs too
    let bwLogs: any[] = []
    if (metric === 'rel_strength') {
        const { data } = await supabase
            .from('bodyweight_logs')
            .select('weight, date')
            .gte('date', startDate.toISOString())
            .order('date', { ascending: true })
        bwLogs = data || []
    }

    const getBwAtDate = (d: string) => {
        if (!bwLogs.length) return 75
        const valid = bwLogs.filter(l => l.date <= d)
        return valid.length === 0 ? bwLogs[0].weight : valid[valid.length - 1].weight
    }

    const exerciseNames: Record<string, string> = {}
    const groupedByDate: Record<string, any> = {}

    logs.forEach(log => {
        const sessionDate = (log.workout_sessions as any)?.date
        if (!sessionDate) return

        const date = new Date(sessionDate).toISOString().split('T')[0]
        if (!groupedByDate[date]) {
            groupedByDate[date] = { date }
        }

        const exId = log.exercise_id
        exerciseNames[exId] = (log.exercises as any)?.name

        let value = Number(log.estimated_1rm)
        if (metric === 'rel_strength') {
            const bw = Number(getBwAtDate(date))
            value = Number((value / bw).toFixed(2))
        }

        groupedByDate[date][exId] = value
    })

    return {
        points: Object.values(groupedByDate).sort((a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        names: exerciseNames
    }
}

// --- Helper Interfaces ---

export interface TrendPoint {
    date: string
    value: number
    [key: string]: any
}

export interface DistributionPoint {
    category: string
    count: number
}

// --- KPI & Basic Trends ---

export async function getKPIs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: bestLift } = await supabase
        .from('exercise_logs')
        .select('estimated_1rm')
        .order('estimated_1rm', { ascending: false })
        .limit(1)
        .single()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: volumeData } = await supabase
        .from('exercise_logs')
        .select('weight, reps, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

    const totalVolume = volumeData?.reduce((acc, log) => acc + (Number(log.weight) * Number(log.reps)), 0) || 0

    const { count: sessionCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('date', thirtyDaysAgo.toISOString())

    const weeklyFrequency = sessionCount ? (sessionCount / 4).toFixed(1) : "0.0"

    return {
        bestLift: bestLift?.estimated_1rm?.toFixed(1) || "0",
        volume: (totalVolume / 1000).toFixed(1) + "k",
        frequency: weeklyFrequency,
        dots: "N/A"
    }
}

export async function get1RMTrend(exerciseId: string, periodDays: number = 90) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
            estimated_1rm,
            created_at,
            exercises!inner(name),
            workout_sessions!inner(date)
        `)
        .eq('exercise_id', exerciseId)
        .gte('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    if (error || !data) return { current: [], comparison: [], exerciseName: '' }

    const exerciseName = (data[0] as any)?.exercises?.name || ''

    const currentPeriod = data.map(log => {
        // @ts-ignore
        const dateStr = log.workout_sessions?.date || log.created_at
        return {
            date: new Date(dateStr).toISOString().split('T')[0],
            value: Number(Number(log.estimated_1rm).toFixed(2))
        }
    })

    // Fetch comparison period
    const compStartDate = new Date(startDate)
    compStartDate.setDate(compStartDate.getDate() - periodDays)

    const { data: compData } = await supabase
        .from('exercise_logs')
        .select(`estimated_1rm, workout_sessions!inner(date)`)
        .eq('exercise_id', exerciseId)
        .gte('workout_sessions.date', compStartDate.toISOString())
        .lt('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    const comparisonPeriod = compData?.map(log => {
        // @ts-ignore
        const d = new Date(log.workout_sessions.date)
        // Shift date forward to align on chart
        d.setDate(d.getDate() + periodDays)
        return {
            date: d.toISOString().split('T')[0],
            value: Number(Number(log.estimated_1rm).toFixed(2))
        }
    }) || []

    return {
        current: currentPeriod,
        comparison: comparisonPeriod,
        exerciseName
    }
}


// --- Analysis 2.0 (Normalization & SBD) ---

export async function getNormalizedMultiTrend(exerciseIds: string[], periodDays: number = 90) {
    if (!exerciseIds.length) return []
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data } = await supabase
        .from('exercise_logs')
        .select(`
            estimated_1rm,
            exercise_id,
            exercises!inner(name),
            workout_sessions!inner(date)
        `)
        .in('exercise_id', exerciseIds)
        .gte('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    if (!data || data.length === 0) return []

    const exerciseBaselines: Record<string, number> = {}
    const exerciseNames: Record<string, string> = {}
    const groupedByDate: Record<string, any> = {}

    data.forEach(log => {
        const sessionDate = (log.workout_sessions as any)?.date
        if (!sessionDate) return

        const date = new Date(sessionDate).toISOString().split('T')[0]
        if (!groupedByDate[date]) {
            groupedByDate[date] = { date }
        }

        const exId = log.exercise_id
        const exName = (log.exercises as any)?.name

        if (!exerciseBaselines[exId]) {
            exerciseBaselines[exId] = Number(log.estimated_1rm)
            exerciseNames[exId] = exName
        }

        const baseline = exerciseBaselines[exId]
        const current = Number(log.estimated_1rm)
        const normalized = baseline > 0 ? Number(((current / baseline) * 100).toFixed(2)) : 100

        groupedByDate[date][exId] = normalized
    })

    return {
        points: Object.values(groupedByDate).sort((a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        names: exerciseNames
    }
}

export async function getSBD1RMTrend(periodDays: number = 180, params: any = {}) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Exercise variants to look for as fallbacks
    const variants = {
        squat: ['squat', 'high bar', 'low bar', 'front squat'],
        bench: ['bench press', 'panca piana', 'dumbbell bench'],
        deadlift: ['deadlift', 'stacco', 'sumo deadlift', 'stacco da terra']
    }

    // 1. Identify IDs for S, B, D
    // Use explicit IDs from params if available, otherwise search by keywords
    let squatId = params.squatId
    let benchId = params.benchId
    let deadliftId = params.deadliftId

    const needsSearch = !squatId || !benchId || !deadliftId
    let exercises: any[] = []

    if (needsSearch) {
        // Expanded keyword search for Italian/English context
        const { data } = await supabase
            .from('exercises')
            .select('id, name')
            .or(`name.ilike.%squat%,name.ilike.%bench%,name.ilike.%deadlift%,name.ilike.%stacco%,name.ilike.%panca%,name.ilike.%distensioni%`)

        const candidateExercises = data || []

        if (candidateExercises.length > 0) {
            // Pick based on usage popularity if multiple matches exist
            const { data: usage } = await supabase
                .from('exercise_logs')
                .select('exercise_id')
                .in('exercise_id', candidateExercises.map(e => e.id))

            const counts: Record<string, number> = {}
            usage?.forEach(u => counts[u.exercise_id] = (counts[u.exercise_id] || 0) + 1)

            const getBest = (keyword: string) => {
                return candidateExercises
                    .filter(e => e.name.toLowerCase().includes(keyword))
                    .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))[0]?.id
            }

            if (!squatId) squatId = getBest('squat')
            if (!benchId) benchId = getBest('bench') || getBest('panca') || getBest('distensioni')
            if (!deadliftId) deadliftId = getBest('deadlift') || getBest('stacco')
        }
    }

    const allIds = [squatId, benchId, deadliftId].filter(Boolean)
    if (allIds.length === 0) return []

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select(`
            estimated_1rm,
            exercise_id,
            workout_sessions!inner(date)
        `)
        .in('exercise_id', allIds)
        .gte('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    if (!logs || logs.length === 0) return []

    const dailyData: Record<string, { date: string, squat: number, bench: number, deadlift: number }> = {}

    logs.forEach(log => {
        // @ts-ignore
        const date = new Date(log.workout_sessions.date).toISOString().split('T')[0]
        const val = Number(log.estimated_1rm)

        if (!dailyData[date]) {
            dailyData[date] = { date, squat: 0, bench: 0, deadlift: 0 }
        }

        if (log.exercise_id === squatId) dailyData[date].squat = Math.max(dailyData[date].squat, val)
        else if (log.exercise_id === benchId) dailyData[date].bench = Math.max(dailyData[date].bench, val)
        else if (log.exercise_id === deadliftId) dailyData[date].deadlift = Math.max(dailyData[date].deadlift, val)
    })

    const sortedDates = Object.keys(dailyData).sort()
    const result: any[] = []
    let lastS = 0, lastB = 0, lastD = 0

    sortedDates.forEach(date => {
        const e = dailyData[date]
        if (e.squat > 0) lastS = e.squat
        if (e.bench > 0) lastB = e.bench
        if (e.deadlift > 0) lastD = e.deadlift
        result.push({
            date,
            squat: Number(lastS.toFixed(2)),
            bench: Number(lastB.toFixed(2)),
            deadlift: Number(lastD.toFixed(2)),
            total: Number((lastS + lastB + lastD).toFixed(2))
        })
    })

    return result
}

// --- Bodyweight & Relative ---

export async function getBodyweightTrend(periodDays: number = 90) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data } = await supabase
        .from('bodyweight_logs')
        .select('weight, date')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true })

    return data?.map(log => ({ date: log.date, value: Number(log.weight) })) || []
}

export async function getRelativeStrengthTrend(exerciseId: string, periodDays: number = 90) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data: logs, error } = await supabase
        .from('exercise_logs')
        .select('estimated_1rm, exercises!inner(name), workout_sessions!inner(date)')
        .eq('exercise_id', exerciseId)
        .gte('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    if (error || !logs || logs.length === 0) return { points: [], exerciseName: '' }

    const exerciseName = (logs[0] as any)?.exercises?.name || ''

    const { data: bwLogs } = await supabase
        .from('bodyweight_logs')
        .select('weight, date')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true })

    const getBwAtDate = (d: string) => {
        if (!bwLogs || bwLogs.length === 0) return 75
        const valid = bwLogs.filter(l => l.date <= d)
        return valid.length === 0 ? bwLogs[0].weight : valid[valid.length - 1].weight
    }

    const points = logs.map(log => {
        // @ts-ignore
        const dateStr = new Date(log.workout_sessions.date).toISOString().split('T')[0]
        const val1RM = Number(log.estimated_1rm)
        const bw = Number(getBwAtDate(dateStr))
        return { date: dateStr, value: Number((val1RM / bw).toFixed(2)), bw, lift: val1RM }
    })

    return { points, exerciseName }
}

// --- Dots, Volume & Hard Sets ---

export async function getCompetitionPointsTrend(periodDays: number = 180, params: any = {}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const settings = await getProgressionSettings(user.id)
    const sbdData = await getSBD1RMTrend(periodDays, params)
    const bwTrend = await getBodyweightTrend(periodDays)

    const getBwAtDate = (d: string) => {
        if (!bwTrend || bwTrend.length === 0) return 75
        const valid = bwTrend.filter(l => l.date <= d)
        return valid.length === 0 ? bwTrend[0]?.value : valid[valid.length - 1].value
    }

    const { calculateDOTS, calculateWilks, calculateIPFGL } = await import("@/utils/formulas")

    return sbdData.map(e => {
        const bw = getBwAtDate(e.date)
        return {
            date: e.date,
            dots: Number(calculateDOTS(e.total, bw, settings.sex).toFixed(2)),
            wilks: Number(calculateWilks(e.total, bw, settings.sex).toFixed(2)),
            ipf: Number(calculateIPFGL(e.total, bw, settings.sex).toFixed(2)),
            total: Number(e.total.toFixed(2)),
            bw: Number(bw.toFixed(2))
        }
    })
}


export async function getVolumeByBodyPart(periodDays: number = 90) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select('weight, reps, exercises!inner(body_parts), workout_sessions!inner(date)')
        .gte('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    if (!logs) return []
    const weeklyData: Record<string, any> = {}

    logs.forEach(log => {
        const sessionDate = (log.workout_sessions as any)?.date
        if (!sessionDate) return
        const date = new Date(sessionDate)
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0]

        // Handle multiple body parts - distribute volume across all target muscles
        // @ts-ignore
        const parts = log.exercises?.body_parts || ['Other']
        const vol = Number(log.weight) * Number(log.reps)

        if (!weeklyData[weekStart]) weeklyData[weekStart] = { date: weekStart }

        parts.forEach((part: string) => {
            weeklyData[weekStart][part] = Number(((weeklyData[weekStart][part] || 0) + vol).toFixed(2))
        })
    })

    return Object.values(weeklyData).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function getHardSetsTrend(periodDays: number = 90) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select('rir, workout_sessions!inner(date)')
        .lte('rir', 3)
        .gte('workout_sessions.date', startDate.toISOString())

    if (!logs) return []
    const setsByWeek: Record<string, number> = {}

    logs.forEach(log => {
        // @ts-ignore
        const session = log.workout_sessions as any
        // @ts-ignore
        const date = new Date(session?.date || (log as any).created_at || new Date())
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0]
        setsByWeek[weekStart] = (setsByWeek[weekStart] || 0) + 1
    })



    return Object.entries(setsByWeek).map(([date, value]) => ({ date, value }))
}

export async function getFatigueScatter(periodDays: number = 90) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select('weight, reps, rir, workout_sessions!inner(id, date)')
        .gte('workout_sessions.date', startDate.toISOString())

    if (!logs) return []
    const sessionAgg: Record<string, any> = {}

    logs.forEach(log => {
        // @ts-ignore
        const sid = log.workout_sessions.id
        // @ts-ignore
        const date = log.workout_sessions.date
        if (!sessionAgg[sid]) sessionAgg[sid] = { volume: 0, rirSum: 0, count: 0, date }
        sessionAgg[sid].volume += (Number(log.weight) * Number(log.reps))
        if (log.rir !== null) {
            sessionAgg[sid].rirSum += (10 - Number(log.rir))
            sessionAgg[sid].count++
        }
    })

    return Object.values(sessionAgg).filter(s => s.count > 0).map(s => ({
        x: Number((Number(s.volume) / 1000).toFixed(2)),
        y: Number((s.rirSum / s.count).toFixed(2)),
        date: s.date
    }))
}

// --- Utils ---

export async function getMuscleBalance(periodDays: number = 30) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select('exercises!inner(body_parts), workout_sessions!inner(date)')
        .gte('workout_sessions.date', startDate.toISOString())

    if (!logs) return []
    const counts: Record<string, number> = {}
    logs.forEach(log => {
        // @ts-ignore
        const parts = log.exercises?.body_parts || ['Other']
        parts.forEach((part: string) => {
            counts[part] = (counts[part] || 0) + 1
        })
    })

    return Object.entries(counts).map(([part, count]) => ({
        subject: part,
        value: count,
        fullMark: Math.max(...Object.values(counts)) * 1.2
    }))
}

export async function getIntensityDistribution(periodDays: number = 90) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)
    const { data: logs } = await supabase.from('exercise_logs').select('rir').not('rir', 'is', null).gte('created_at', startDate.toISOString())

    if (!logs) return []
    const dist: Record<string, number> = { "0": 0, "1": 0, "2": 0, "3": 0, "4+": 0 }
    logs.forEach(log => {
        const r = Math.round(Number(log.rir))
        if (r <= 0) dist["0"]++
        else if (r === 1) dist["1"]++
        else if (r === 2) dist["2"]++
        else if (r === 3) dist["3"]++
        else dist["4+"]++
    })

    return Object.entries(dist).map(([rir, count]) => ({ rir: `RIR ${rir}`, count }))
}

export async function getVolumeStats(periodDays: number = 90) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select('weight, reps, workout_sessions!inner(date)')
        .gte('workout_sessions.date', startDate.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    const processLogs = (data: any[]) => {
        const volByWeek: Record<string, number> = {}
        data.forEach(log => {
            const sessionDate = (log.workout_sessions as any)?.date
            if (!sessionDate) return
            const date = new Date(sessionDate)
            const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0]
            volByWeek[weekStart] = (volByWeek[weekStart] || 0) + (Number(log.weight) * Number(log.reps))
        })
        return Object.entries(volByWeek).map(([date, value]) => ({ date, value }))
    }

    const currentPeriod = processLogs(logs || [])

    // Comparison Period
    const compStartDate = new Date(startDate)
    compStartDate.setDate(compStartDate.getDate() - periodDays)
    const { data: compLogs } = await supabase
        .from('exercise_logs')
        .select('weight, reps, workout_sessions!inner(date)')
        .gte('workout_sessions.date', compStartDate.toISOString())
        .lt('workout_sessions.date', startDate.toISOString())

    const comparisonPeriod = processLogs(compLogs || []).map(d => {
        const date = new Date(d.date)
        date.setDate(date.getDate() + periodDays)
        return { date: date.toISOString().split('T')[0], value: d.value }
    })

    return { current: currentPeriod, comparison: comparisonPeriod }
}


export async function getPerformanceFeed() {
    const supabase = await createClient()
    const { data: logs } = await supabase.from('exercise_logs').select('id, estimated_1rm, weight, reps, exercises(name), workout_sessions!inner(date)').order('workout_sessions(date)', { ascending: true })

    if (!logs) return []

    const latestImprovements: Record<string, any> = {}
    const exMaxes: Record<string, number> = {}

    logs.forEach(log => {
        // @ts-ignore
        const name = log.exercises?.name || 'Unknown'
        const cur = Number(log.estimated_1rm)
        const prev = exMaxes[name] || 0

        if (cur > prev) {
            if (prev > 0) {
                // Store/overwrite the latest improvement for this exercise
                latestImprovements[name] = {
                    id: log.id,
                    exercise: name,
                    // @ts-ignore
                    date: log.workout_sessions?.date,
                    value: cur,
                    raw: `${log.weight}kg x ${log.reps}`,
                    improvement: (((cur - prev) / prev) * 100).toFixed(1),
                    // @ts-ignore
                    unixTime: new Date(log.workout_sessions?.date).getTime()
                }
            }
            exMaxes[name] = cur
        }
    })

    const limit = new Date()
    limit.setDate(limit.getDate() - 30)

    // Filter by date and return as an array
    return Object.values(latestImprovements)
        .filter((f: any) => f.unixTime >= limit.getTime())
        .sort((a: any, b: any) => b.unixTime - a.unixTime)
}

export async function getExercisesList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    /**
     * "In my DB" refers to exercises actually used by the user.
     * We filter exercises that have active logs in the user's sessions.
     */
    const { data, error } = await supabase
        .from('exercises')
        .select(`
            id, 
            name, 
            body_parts,
            exercise_logs!inner(
                workout_sessions!inner(user_id)
            )
        `)
        .eq('exercise_logs.workout_sessions.user_id', user.id)
        .order('name')

    if (error) {
        console.error('Error fetching exercises list:', error)
        return []
    }

    // Deduplicate by exercise ID as an exercise has multiple logs
    const seen = new Set()
    return (data || []).filter((ex: any) => {
        if (seen.has(ex.id)) return false
        seen.add(ex.id)
        return true
    })
}

// --- CONFIG ACTIONS ---

export async function getDashboardConfig() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data } = await supabase
        .from('progression_settings')
        .select('dashboard_config')
        .eq('user_id', user.id)
        .single()

    return data?.dashboard_config || {}
}

export async function updateDashboardConfig(config: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    const { error } = await supabase
        .from('progression_settings')
        .upsert({
            user_id: user.id,
            dashboard_config: config,
            updated_at: new Date().toISOString()
        })

    return { success: !error }
}
