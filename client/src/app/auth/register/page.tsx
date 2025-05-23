import { RegisterForm } from '../../components/RegisterForm'

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
                    Register
                </h1>
                <RegisterForm />
            </div>
        </div>
    )
}
