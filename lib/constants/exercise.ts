import { BodyPart, ExerciseType } from "@/types/database"
import { Option } from "@/components/ui/multi-select"

export const BODY_PART_OPTIONS: Option[] = [
    { label: 'Chest', value: 'Chest' },
    { label: 'Back (Lats)', value: 'Back (Lats)' },
    { label: 'Back (Upper/Traps)', value: 'Back (Upper/Traps)' },
    { label: 'Lower Back', value: 'Lower Back' },
    { label: 'Shoulders (Front)', value: 'Shoulders (Front)' },
    { label: 'Shoulders (Side)', value: 'Shoulders (Side)' },
    { label: 'Shoulders (Rear)', value: 'Shoulders (Rear)' },
    { label: 'Biceps', value: 'Biceps' },
    { label: 'Triceps', value: 'Triceps' },
    { label: 'Forearms', value: 'Forearms' },
    { label: 'Quadriceps', value: 'Quadriceps' },
    { label: 'Hamstrings', value: 'Hamstrings' },
    { label: 'Glutes', value: 'Glutes' },
    { label: 'Calves', value: 'Calves' },
    { label: 'Core', value: 'Core' },
    { label: 'Functional', value: 'Functional' },
]

export const EQUIPMENT_TYPE_OPTIONS: { value: ExerciseType; label: string }[] = [
    { value: 'barbell', label: 'Barbell' },
    { value: 'dumbbell', label: 'Dumbbell' },
    { value: 'cable', label: 'Cable' },
    { value: 'machine', label: 'Machine' },
    { value: 'bodyweight', label: 'Bodyweight' },
    { value: 'other', label: 'Other' }
]
