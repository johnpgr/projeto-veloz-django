"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type {
    LoginData,
    RegisterData,
    User,
    LoginResponse,
    UpdateProfileData,
} from "./auth"

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000"

async function fetchServerAPI<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const url = `${INTERNAL_API_URL}${endpoint}`
    const defaultOptions: RequestInit = {
        headers: {
            ...options.headers,
            "Content-Type": "application/json",
        },
    }
    console.log({ url, ...defaultOptions, ...options })
    const response = await fetch(url, { ...defaultOptions, ...options })

    if (!response.ok) {
        let errorData
        let errorMessage = "An API error occurred"
        try {
            errorData = await response.json()
            console.error("API Error Data:", errorData)

            if (typeof errorData === "object" && errorData !== null) {
                if (errorData.detail) {
                    errorMessage = errorData.detail
                } else {
                    const fieldErrors = Object.entries(errorData)
                        .map(([field, messages]) => {
                            if (Array.isArray(messages)) {
                                const formattedField =
                                    field.charAt(0).toUpperCase() +
                                    field.slice(1)
                                return `${formattedField}: ${messages.join(" ")}`
                            }
                            return null
                        })
                        .filter(Boolean)
                        .join(". ")
                    if (fieldErrors) {
                        errorMessage = fieldErrors
                    }
                }
            } else if (typeof errorData === "string") {
                errorMessage = errorData
            }
        } catch (e) {
            errorMessage =
                response.statusText ||
                "An API error occurred after a non-JSON response."
        }
        console.error("Processed API Error Message:", errorMessage)
        throw new Error(errorMessage)
    }

    if (response.status === 204) {
        // No Content
        return undefined as T
    }
    return response.json()
}

export interface ActionResponse {
    success: boolean
    message?: string
    user?: User
    error?: string
}

export async function loginAction(
    prevState: ActionResponse | undefined,
    formData: FormData,
): Promise<ActionResponse> {
    const rawFormData = Object.fromEntries(formData.entries())
    const loginData: LoginData = {
        username: rawFormData.username as string,
        password: rawFormData.password as string,
    }

    try {
        const response = await fetchServerAPI<LoginResponse>("/auth/login/", {
            method: "POST",
            body: JSON.stringify(loginData),
        })

        if (response.access && response.refresh && response.user) {
            const cookieStore = await cookies()
            cookieStore.set("access_token", response.access, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                sameSite: "lax",
                maxAge: 60 * 60, // 1 hour
            })
            cookieStore.set("refresh_token", response.refresh, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 7 days
            })

            revalidatePath("/", "layout")
            return { success: true, user: response.user }
        } else {
            return {
                success: false,
                error: "Login failed: Invalid response from server.",
            }
        }
    } catch (error: any) {
        console.error("Login Action Error:", error)
        return { success: false, error: error.message || "Login failed." }
    }
}

export async function registerAction(
    prevState: ActionResponse | undefined,
    formData: FormData,
): Promise<ActionResponse> {
    const rawFormData = Object.fromEntries(formData.entries())
    const registerData: RegisterData = {
        username: rawFormData.username as string,
        email: rawFormData.email as string,
        password: rawFormData.password as string,
        password_confirm: rawFormData.password_confirm as string,
        first_name: (rawFormData.first_name as string) || undefined,
        last_name: (rawFormData.last_name as string) || undefined,
    }

    try {
        const response = await fetchServerAPI<LoginResponse>(
            "/auth/register/",
            {
                method: "POST",
                body: JSON.stringify(registerData),
            },
        )

        if (response.access && response.refresh && response.user) {
            const cookieStore = await cookies()
            cookieStore.set("access_token", response.access, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                sameSite: "lax",
                maxAge: 60 * 60, // 1 hour
            })
            cookieStore.set("refresh_token", response.refresh, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 7 days
            })

            revalidatePath("/", "layout")
            return { success: true, user: response.user }
        } else {
            return {
                success: false,
                error: "Registration failed: Invalid response.",
            }
        }
    } catch (error: any) {
        console.error("Register Action Error:", error)
        return {
            success: false,
            error: error.message || "Registration failed.",
        }
    }
}

export async function logoutAction(): Promise<void> {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refresh_token")?.value
    const accessToken = cookieStore.get("access_token")?.value

    if (refreshToken) {
        try {
            await fetchServerAPI<void>("/auth/logout/", {
                method: "POST",
                headers: accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {},
                body: JSON.stringify({ refresh: refreshToken }),
            })
        } catch (error: any) {
            console.error("Logout API call failed:", error.message)
        }
    }
    cookieStore.delete("access_token")
    cookieStore.delete("refresh_token")
    revalidatePath("/", "layout")
    redirect("/")
}

export async function getCurrentUserServer(): Promise<User | null> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value
    if (!accessToken) {
        return null
    }
    try {
        const user = await fetchServerAPI<User>("/auth/user/", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
        return user
    } catch (error) {
        console.error("Failed to get current user:", error)
        return null
    }
}

export async function updateProfileAction(
    prevState: ActionResponse | undefined,
    formData: FormData,
): Promise<ActionResponse> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value

    if (!accessToken) {
        return { success: false, error: "Not authenticated" }
    }

    const rawFormData = Object.fromEntries(formData.entries())
    const updateData: UpdateProfileData = {}

    // Only include fields in updateData if they are present in formData
    // and are actual strings.
    // For fields like first_name and last_name, an empty string from the form
    // means the user intends to clear the field.
    if (
        rawFormData.email !== undefined &&
        typeof rawFormData.email === "string"
    ) {
        updateData.email = rawFormData.email
    }
    if (
        rawFormData.first_name !== undefined &&
        typeof rawFormData.first_name === "string"
    ) {
        updateData.first_name = rawFormData.first_name
    }
    if (
        rawFormData.last_name !== undefined &&
        typeof rawFormData.last_name === "string"
    ) {
        updateData.last_name = rawFormData.last_name
    }

    // If no actual data fields were populated for update (e.g. form submitted with no changes or only non-updatable fields)
    // It's better to check if any of the relevant fields (email, first_name, last_name) were actually provided.
    const hasUpdateData =
        updateData.email !== undefined ||
        updateData.first_name !== undefined ||
        updateData.last_name !== undefined

    if (!hasUpdateData) {
        return {
            success: true,
            message: "No changes submitted or no updatable fields provided.",
        }
    }

    try {
        const updatedUser = await fetchServerAPI<User>("/auth/profile/", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updateData), // Send data as is, backend handles empty strings for clearing fields
        })

        revalidatePath("/", "layout")
        revalidatePath("/auth/profile") // Assuming a profile page exists at this path
        return {
            success: true,
            user: updatedUser,
            message: "Profile updated successfully.",
        }
    } catch (error: any) {
        console.error("Update Profile Action Error:", error)
        return {
            success: false,
            error: error.message || "Failed to update profile.",
        }
    }
}
