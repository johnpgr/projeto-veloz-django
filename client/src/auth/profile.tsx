import { UserProfile } from '../components/UserProfile'
import { AuthAPI } from "~/lib/auth"
import { redirect } from "react-router"

export function clientLoader() {
    if (!AuthAPI.isAuthenticated()) {
        return redirect("/auth/login")
    }
}

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
                    Profile
                </h1>
                <UserProfile />
            </div>
        </div>
    )
}
