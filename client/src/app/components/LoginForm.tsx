'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, ActionResponse } from '../lib/actions' // Import server action
import { useAuth } from '../lib/auth-context'
import Link from 'next/link'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50"
        >
            {pending ? 'Logging in...' : 'Login'}
        </button>
    )
}

export function LoginForm() {
    const { refreshUser } = useAuth()
    const initialState: ActionResponse = { success: false }
    const [state, formAction] = useActionState(loginAction, initialState)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        if (state.success && state.user) {
            refreshUser()
        }
    }, [state, refreshUser])

    return (
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Login</h2>
            
            {state.error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">
                    <p>{state.error}</p>
                </div>
            )}
            
            <form action={formAction} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                    </label>
                    <input
                        id="username"
                        name="username" // Name attribute is crucial for FormData
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="your_username"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password" // Name attribute is crucial for FormData
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="••••••••"
                    />
                </div>
                
                <SubmitButton />
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
                Don't have an account?{'' }
                <Link href="/auth/register">
                    Register here
                </Link>
            </p>
        </div>
    )
}
