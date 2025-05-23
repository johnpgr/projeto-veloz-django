import { AuthAPI } from "~/lib/auth"
import { LoginForm } from "../components/LoginForm"
import { redirect } from "react-router"

export function clientLoader() {
    if (AuthAPI.isAuthenticated()) {
        return redirect("/auth/profile")
    }
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-100 px-4 py-12">
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-8 text-center text-4xl font-bold text-gray-800">
                    Login
                </h1>
                <LoginForm />
            </div>
        </div>
    )
}
