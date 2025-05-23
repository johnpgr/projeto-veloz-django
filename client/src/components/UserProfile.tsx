import React from "react"
import type { UpdateProfileData, User } from "../lib/auth"
import { AuthContext } from "~/lib/auth-context"
import { useNavigate } from "react-router"

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

interface UserProfileFormActionState {
    error?: string
    success?: boolean
    message?: string
}

const initialProfileFormState: UserProfileFormActionState = {
    error: undefined,
    success: false,
    message: undefined,
}

export function UserProfile() {
    const auth = React.use(AuthContext)!
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = React.useState(false)
    const [formData, setFormData] = React.useState<UpdateProfileData>(() => ({
        first_name: auth.user?.first_name || "",
        last_name: auth.user?.last_name || "",
        email: auth.user?.email || "",
    }))

    async function updateProfileAction(
        _: UserProfileFormActionState,
        formPayload: FormData,
    ): Promise<UserProfileFormActionState> {
        const dataToUpdate: UpdateProfileData = {}
        const email = formPayload.get("email") as string
        const first_name = formPayload.get("first_name") as string
        const last_name = formPayload.get("last_name") as string

        if (email) dataToUpdate.email = email
        if (first_name) dataToUpdate.first_name = first_name
        if (last_name) dataToUpdate.last_name = last_name

        try {
            await auth.updateProfile(dataToUpdate)
            return { success: true, message: "Profile updated successfully!" }
        } catch (err: any) {
            return {
                error: err.message || "Failed to update profile",
                success: false,
            }
        }
    }

    const [state, formAction, isPending] = React.useActionState(
        updateProfileAction,
        initialProfileFormState,
    )

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
    }

    async function handleLogout() {
        try {
            await auth.logout().then(() => navigate("/", { replace: true }))
        } catch (err: any) {
            console.error("Logout error:", err)
        }
    }

    React.useEffect(() => {
        if (auth.user) {
            setFormData({
                first_name: auth.user.first_name || "",
                last_name: auth.user.last_name || "",
                email: auth.user.email || "",
            })
        }
    }, [auth.user])

    React.useEffect(() => {
        if (state.success) {
            setIsEditing(false)
            auth.refreshUser() // Refresh user in context, which will trigger the effect above to update formData
        }
        // Only run when state.success changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.success])

    if (!auth.user) return null

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

                {state.error && (
                    <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                        {state.error}
                    </div>
                )}

                {state.success && state.message && (
                    <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
                        {state.message}
                    </div>
                )}

                {!isEditing ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Username
                                </label>
                                <p className="text-gray-900">
                                    {auth.user.username}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Email
                                </label>
                                <p className="text-gray-900">
                                    {auth.user.email}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    First Name
                                </label>
                                <p className="text-gray-900">
                                    {auth.user.first_name || "Not set"}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Last Name
                                </label>
                                <p className="text-gray-900">
                                    {auth.user.last_name || "Not set"}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Member Since
                                </label>
                                <p className="text-gray-900">
                                    {new Date(
                                        auth.user.date_joined,
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
                                    {auth.user.is_staff ? "Staff" : "Member"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => {
                                    setIsEditing(true)
                                    // Reset form action state when entering edit mode
                                    // This is a simple way to clear previous errors/success messages
                                    // A more sophisticated approach might involve a dedicated reset function for the action state
                                    // Or simply rely on the user submitting the form again to clear.
                                    // For now, we can clear local success/error messages if they were separate from useActionState
                                }}
                                className="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    <form action={formAction} className="space-y-4">
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
                                    value={formData.first_name || ""}
                                    onChange={handleChange}
                                    disabled={isPending}
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
                                    value={formData.last_name || ""}
                                    onChange={handleChange}
                                    disabled={isPending}
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
                                value={formData.email || ""}
                                onChange={handleChange}
                                required
                                disabled={isPending}
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false)
                                    // Reset form data to current user state when cancelling
                                    if (auth.user) {
                                        setFormData({
                                            first_name:
                                                auth.user.first_name || "",
                                            last_name:
                                                auth.user.last_name || "",
                                            email: auth.user.email || "",
                                        })
                                    }
                                    // Consider resetting action state here as well if needed
                                }}
                                className="focus:shadow-outline rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700 focus:outline-none"
                                disabled={isPending}
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
