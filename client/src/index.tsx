import { Link } from "react-router"

export default function AuthPage() {
    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
                    JWT Authentication Demo
                </h1>
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-lg p-1 shadow-md flex gap-2">
                        <Link to="/auth/login">
                            <button className="px-6 py-2 rounded-md font-medium transition-colors bg-blue-500 text-white">
                                Login
                            </button>
                        </Link>
                        <Link to="/auth/register">
                            <button className="px-6 py-2 rounded-md font-medium transition-colors bg-green-500 text-white">
                                Register
                            </button>
                        </Link>
                        <Link to="/auth/profile">
                            <button className="px-6 py-2 rounded-md font-medium transition-colors bg-gray-700 text-white">
                                Profile
                            </button>
                        </Link>
                    </div>
                </div>
                <div className="mt-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        Authentication Features
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                JWT Features
                            </h3>
                            <ul className="text-gray-600 space-y-1">
                                <li>• Access and refresh tokens</li>
                                <li>• Automatic token refresh</li>
                                <li>• Token blacklisting on logout</li>
                                <li>• Secure token storage</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                API Endpoints
                            </h3>
                            <ul className="text-gray-600 space-y-1">
                                <li>• POST /auth/login/</li>
                                <li>• POST /auth/register/</li>
                                <li>• POST /auth/refresh/</li>
                                <li>• POST /auth/logout/</li>
                                <li>• GET /auth/user/</li>
                                <li>• PATCH /auth/profile/</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
