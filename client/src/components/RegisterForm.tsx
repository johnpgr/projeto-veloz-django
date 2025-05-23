import React from "react"
import { Link, useNavigate } from "react-router"
import type { RegisterData } from "~/lib/auth"
import { AuthContext } from "~/lib/auth-context"

interface RegisterFormActionState {
    error?: string
    passwordMatchError?: boolean
    success?: boolean
}

const initialRegisterState: RegisterFormActionState = {
    error: undefined,
    passwordMatchError: false,
    success: false,
}

export function RegisterForm() {
    const auth = React.use(AuthContext)!
    const navigate = useNavigate()
    const [formData, setFormData] = React.useState<RegisterData>({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
        first_name: "",
        last_name: "",
    })

    const [state, formAction, isPending] = React.useActionState(
        registerAction,
        initialRegisterState,
    )

    async function registerAction(
        _: RegisterFormActionState,
        formPayload: FormData,
    ): Promise<RegisterFormActionState> {
        const username = formPayload.get("username") as string
        const email = formPayload.get("email") as string
        const password = formPayload.get("password") as string
        const password_confirm = formPayload.get("password_confirm") as string
        const first_name =
            (formPayload.get("first_name") as string) || undefined
        const last_name = (formPayload.get("last_name") as string) || undefined

        if (password !== password_confirm) {
            return { passwordMatchError: true, success: false }
        }

        try {
            await auth.register({
                username,
                email,
                password,
                password_confirm,
                first_name,
                last_name,
            })
            return { success: true }
        } catch (err: any) {
            return {
                error: err.message || "Registration failed",
                success: false,
            }
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
        // Reset errors when user types
        if (state.error || state.passwordMatchError) {
            // This is a bit tricky with useActionState as state is managed by the hook.
            // A common pattern is to let the next action submission clear these.
            // Or, you could manage these specific UI errors with local useState if preferred.
        }
    }

    React.useEffect(() => {
        if (state.success) {
            setFormData({
                username: "",
                email: "",
                password: "",
                password_confirm: "",
                first_name: "",
                last_name: "",
            })
            navigate("/auth/login", { replace: true })
        } else if (state.error) {
            // Clear password fields on error
            setFormData((prev) => ({
                ...prev,
                password: "",
                password_confirm: "",
            }))
        }
    }, [state.success, state.error])

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
            {state.passwordMatchError && (
                <div className="mb-4 rounded-md border border-red-300 bg-red-100 p-3 text-red-700">
                    <p>Passwords do not match.</p>
                </div>
            )}

            <form action={formAction} className="space-y-6">
                <div>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={isPending}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                        placeholder="your_username"
                    />
                </div>

                <div>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isPending}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isPending}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                        placeholder="Password"
                    />
                </div>
                <div>
                    <input
                        id="password_confirm"
                        name="password_confirm"
                        type="password"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        required
                        disabled={isPending}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                        placeholder="Confirm Password"
                    />
                </div>
                <div>
                    <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        disabled={isPending}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                        placeholder="John"
                    />
                </div>

                <div>
                    <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        disabled={isPending}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                        placeholder="Doe"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="focus:shadow-outline w-full rounded-lg bg-green-500 px-4 py-3 font-bold text-white transition-colors hover:bg-green-600 focus:outline-none disabled:opacity-50"
                >
                    {isPending ? "Registering..." : "Register"}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                    to="/auth/login"
                    className="font-medium text-green-500 hover:text-green-600"
                >
                    Login here
                </Link>
            </p>
        </div>
    )
}
