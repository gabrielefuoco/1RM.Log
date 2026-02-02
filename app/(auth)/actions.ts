"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
        // redirect("/login?error=Invalid credentials")
    }

    revalidatePath("/", "layout")
    redirect("/")
}

export async function signup(formData: FormData) {
    console.log("Starting signup process...")
    const supabase = await createClient()

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    }

    console.log("Signup data prepared (password hidden)")
    const { error } = await supabase.auth.signUp(data)

    if (error) {
        console.error("Supabase signup error:", error.message)
        return { error: error.message }
    }

    console.log("Signup successful")

    // Without email confirm enabled in Supabase, this might log them in immediately.
    // Or it might require email verification.
    // For MVP we assume auto-confirm or user manually verifies.

    // Return success to let client show "Check Email" or redirect manually
    return { success: true }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath("/", "layout")
    redirect("/login")
}
