"use client"

import React from "react"
import { useAuth } from "../lib/auth-context"
import type { UpdateProfileData } from "../lib/auth"
import { updateProfileAction, type ActionResponse } from "../lib/actions" // Import server action and response type

interface SubmitButtonProps {
    isPending: boolean
}

function SubmitButton({ isPending }: SubmitButtonProps) {
    return (
        <button
            type="submit"
            disabled={isPending}
            className="focus:shadow-outline rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700 focus:outline-none disabled:opacity-50"
        >
            {isPending ? "Saving..." : "Save Changes"}
        </button>
    )
}

export function UserProfile() {
    const { user, logout, refreshUser } = useAuth()
    const initialState: ActionResponse = { success: false }
    const [state, formAction] = React.useActionState(
        updateProfileAction,
        initialState,
    )
    const [isPending, startTransition] = React.useTransition()
    const [isEditing, setIsEditing] = React.useState(false)
    const [error, setError] = React.useState("")
    const [success, setSuccess] = React.useState("")

    const [formData, setFormData] = React.useState<UpdateProfileData>(() => ({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
    }))

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
    }

    const handleLogout = async () => {
        try {
            await logout()
        } catch (err: any) {
            console.error("Logout error:", err)
        }
    }

    const handleFormSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()
        const formPayload = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
            if (value) {
                formPayload.append(key, value)
            }
        })

        startTransition(() => {
            formAction(formPayload)
        })
    }

    React.useEffect(() => {
        if (state.success && state.user) {
            setSuccess(state.message || "Profile updated successfully!")
            setError("")
            refreshUser()
            setFormData({
                first_name: state.user.first_name,
                last_name: state.user.last_name,
                email: state.user.email,
            })
        } else if (state.error) {
            setError(state.error)
            setSuccess("")
        }
    }, [state, refreshUser])

    if (!user) {
        return null
    }

    return (
        <div className="mx-auto w-full max-w-2xl">
            <div className="mb-4 rounded-lg bg-white px-8 pt-6 pb-8 shadow-md">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">
                        User Profile
                    </h2>
                    <button
                        onClick={handleLogout}
                        className="focus:shadow-outline rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700 focus:outline-none"
                    >
                        Logout
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
                        {success}
                    </div>
                )}

                {!isEditing ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Username
                                </label>
                                <p className="text-gray-900">{user.username}</p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Email
                                </label>
                                <p className="text-gray-900">{user.email}</p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    First Name
                                </label>
                                <p className="text-gray-900">
                                    {user.first_name || "Not set"}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Last Name
                                </label>
                                <p className="text-gray-900">
                                    {user.last_name || "Not set"}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Member Since
                                </label>
                                <p className="text-gray-900">
                                    {new Date(
                                        user.date_joined,
                                    ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Status
                                </label>
                                <p className="text-gray-900">
                                    {user.is_staff ? "Staff" : "Member"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit}>
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                    htmlFor="first_name"
                                >
                                    First Name
                                </label>
                                <input
                                    className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    placeholder="First Name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                    htmlFor="last_name"
                                >
                                    Last Name
                                </label>
                                <input
                                    className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    placeholder="Last Name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label
                                className="mb-2 block text-sm font-bold text-gray-700"
                                htmlFor="email"
                            >
                                Email
                            </label>
                            <input
                                className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false)
                                    setError("")
                                    setSuccess("")
                                }}
                                className="focus:shadow-outline rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <SubmitButton isPending={isPending} />
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
