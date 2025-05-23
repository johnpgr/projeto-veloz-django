import React from "react"
import { Link, useNavigate } from "react-router"
import { AuthContext } from "~/lib/auth-context"
import type { LoginData } from "~/lib/auth"

interface LoginFormActionState {
    error?: string
    success?: boolean
}

const initialLoginState: LoginFormActionState = {
    error: undefined,
    success: false,
}

export function LoginForm() {
    const auth = React.use(AuthContext)!
    const navigate = useNavigate()
    const [username, setUsername] = React.useState("")
    const [password, setPassword] = React.useState("")

    async function loginAction(
        _: LoginFormActionState,
        formData: FormData,
    ): Promise<LoginFormActionState> {
        const usernameVal = formData.get("username") as string
        const passwordVal = formData.get("password") as string

        try {
            const credentials: LoginData = {
                username: usernameVal,
                password: passwordVal,
            }
            await auth.login(credentials)
            return { success: true }
        } catch (err: any) {
            return { error: err.message || "Login failed", success: false }
        }
    }

    const [state, formAction, isPending] = React.useActionState(
        loginAction,
        initialLoginState,
    )

    React.useEffect(() => {
        if (state.success) {
            setUsername("")
            setPassword("")
            auth.refreshUser()
            navigate("/auth/profile", { replace: true })
        }
    }, [state.success])

    return (
        <div className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
                Login
            </h2>

            {state.error && (
                <div className="mb-4 rounded-md border border-red-300 bg-red-100 p-3 text-red-700">
                    <p>{state.error}</p>
                </div>
            )}

            <form action={formAction} className="space-y-6">
                <div>
                    <label
                        htmlFor="username"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Username
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isPending}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                        placeholder="your_username"
                    />
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isPending}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none disabled:opacity-50 sm:text-sm"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="focus:shadow-outline w-full rounded-lg bg-blue-500 px-4 py-3 font-bold text-white transition-colors hover:bg-blue-600 focus:outline-none disabled:opacity-50"
                >
                    {isPending ? "Logging in..." : "Login"}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                    to="/auth/register"
                    className="font-medium text-blue-500 hover:text-blue-600"
                >
                    Register here
                </Link>
            </p>
        </div>
    )
}
