
const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://jheygkbzzvaakphhnpyy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXlna2J6enZhYWtwaGhucHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTc1NDgsImV4cCI6MjA4NTM3MzU0OH0.B80BIqH36KFMnebGgzjfUTDbluPmw1XudpfwIYMnbvk'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
    console.log("--- DB DIAGNOSTICS ---")

    // 1. Check Programs
    const { data: programs } = await supabase.from('programs').select('*')
    console.log("Programs Count:", programs?.length || 0)
    programs?.forEach(p => console.log(`Program: ${p.name} | Active: ${p.is_active} | User: ${p.user_id}`))

    // 2. Check Templates
    const { data: templates } = await supabase.from('workout_templates').select('id, name, program_id')
    console.log("Templates Count:", templates?.length || 0)

    // 3. Check Template Exercises
    const { data: te } = await supabase.from('template_exercises').select('id, workout_template_id, exercise_id')
    console.log("Template Exercises Count:", te?.length || 0)

    // 4. Check Exercises (to see if IDs match)
    const { data: ex } = await supabase.from('exercises').select('id, name').limit(5)
    console.log("Sample Exercises in DB:", ex?.map(e => `${e.name} (${e.id})`).join(', '))

    console.log("--- END DIAGNOSTICS ---")
}
run()
