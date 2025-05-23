"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { registerAction, ActionResponse } from "../lib/actions"
import { useAuth } from "../lib/auth-context"
import { RegisterData } from "../lib/auth"
import Link from "next/link"

interface SubmitButtonProps {
    isPending: boolean
}

function SubmitButton({ isPending }: SubmitButtonProps) {
    return (
        <button
            type="submit"
            disabled={isPending}
            className="focus:shadow-outline w-full rounded-lg bg-green-500 px-4 py-3 font-bold text-white transition-colors hover:bg-green-600 focus:outline-none disabled:opacity-50"
        >
            {isPending ? "Registering..." : "Register"}
        </button>
    )
}

export function RegisterForm() {
    const { refreshUser } = useAuth()
    const initialState: ActionResponse = { success: false }
    const [state, formAction] = useActionState(registerAction, initialState)
    const [isPending, startTransition] = useTransition()

    const [formData, setFormData] = useState<RegisterData>({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
        first_name: "",
        last_name: "",
    })
    const [passwordMatchError, setPasswordMatchError] = useState(false)

    useEffect(() => {
        if (state.success && state.user) {
            refreshUser()
            setFormData({
                username: "",
                email: "",
                password: "",
                password_confirm: "",
                first_name: "",
                last_name: "",
            })
        } else if (state.error) {
            // Clear password fields if there was an error, as they shouldn't be kept
            setFormData((prev) => ({
                ...prev,
                password: "",
                password_confirm: "",
            }))
        }
    }, [state, refreshUser])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
        if (
            e.target.name === "password" ||
            e.target.name === "password_confirm"
        ) {
            setPasswordMatchError(false)
        }
    }

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (formData.password !== formData.password_confirm) {
            setPasswordMatchError(true)
            return
        }
        setPasswordMatchError(false)

        const formPayload = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
            if (value) {
                // Only append if value is not empty, matching server action expectations
                formPayload.append(key, value)
            }
        })

        startTransition(() => {
            formAction(formPayload)
        })
    }

    return (
        <div className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
                Register
            </h2>

            {state.error && (
                <div className="mb-4 rounded-md border border-red-300 bg-red-100 p-3 text-red-700">
                    <p>{state.error}</p>
                </div>
            )}
            {passwordMatchError && (
                <div className="mb-4 rounded-md border border-red-300 bg-red-100 p-3 text-red-700">
                    <p>Passwords do not match.</p>
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                    <label
                        htmlFor="username"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Username *
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm"
                        placeholder="your_username"
                    />
                </div>
                <div>
                    <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Email *
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm"
                        placeholder="you@example.com"
                    />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="first_name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            First Name
                        </label>
                        <input
                            id="first_name"
                            name="first_name"
                            type="text"
                            value={formData.first_name}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm"
                            placeholder="John"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="last_name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Last Name
                        </label>
                        <input
                            id="last_name"
                            name="last_name"
                            type="text"
                            value={formData.last_name}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm"
                            placeholder="Doe"
                        />
                    </div>
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Password *
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm"
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label
                        htmlFor="password_confirm"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Confirm Password *
                    </label>
                    <input
                        id="password_confirm"
                        name="password_confirm"
                        type="password"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        required
                        minLength={8}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm"
                        placeholder="••••••••"
                    />
                </div>

                <SubmitButton isPending={isPending} />
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                    href="/auth/login"
                    className="font-medium text-green-600 hover:text-green-500"
                >
                    Login here
                </Link>
            </p>
        </div>
    )
}
