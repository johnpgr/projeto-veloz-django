import React from 'react'
import { AuthAPI, type User, type LoginData, type RegisterData, type UpdateProfileData } from './auth'

export interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (credentials: LoginData) => Promise<void>
    register: (userData: RegisterData) => Promise<void>
    logout: () => Promise<void>
    updateProfile: (userData: UpdateProfileData) => Promise<void>
    refreshUser: () => Promise<void>
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export interface AuthProviderProps {
    children: React.ReactNode
    initialUser?: User | null // Allow passing initial user from server component
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
    const [user, setUser] = React.useState<User | null>(initialUser)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isInitialized, setIsInitialized] = React.useState(false)

    // Initialize auth state on mount
    React.useEffect(() => {
        const initializeAuth = async () => {
            if (initialUser) {
                setUser(initialUser)
                setIsInitialized(true)
                return
            }

            // Check if user is authenticated and get user info
            if (AuthAPI.isAuthenticated()) {
                try {
                    setIsLoading(true)
                    const currentUser = await AuthAPI.getCurrentUser()
                    setUser(currentUser)
                } catch (error) {
                    console.error('Failed to get current user:', error)
                    // Clear invalid tokens
                    AuthAPI.clearTokens()
                    setUser(null)
                } finally {
                    setIsLoading(false)
                }
            }
            setIsInitialized(true)
        }

        initializeAuth()
    }, [initialUser])

    const login = async (credentials: LoginData) => {
        try {
            setIsLoading(true)
            const response = await AuthAPI.login(credentials)
            setUser(response.user)
        } catch (error) {
            setUser(null)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (userData: RegisterData) => {
        try {
            setIsLoading(true)
            const response = await AuthAPI.register(userData)
            setUser(response.user)
        } catch (error) {
            setUser(null)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            setIsLoading(true)
            await AuthAPI.logout()
            setUser(null)
        } catch (error) {
            console.error('Logout error:', error)
            // Clear user state even if logout fails
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    const updateProfile = async (userData: UpdateProfileData) => {
        try {
            setIsLoading(true)
            const updatedUser = await AuthAPI.updateProfile(userData)
            setUser(updatedUser)
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const refreshUser = async () => {
        if (!AuthAPI.isAuthenticated()) {
            setUser(null)
            return
        }

        try {
            setIsLoading(true)
            const currentUser = await AuthAPI.getCurrentUser()
            setUser(currentUser)
        } catch (error) {
            console.error('Failed to refresh user:', error)
            AuthAPI.clearTokens()
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    const value: AuthContextType = {
        user,
        isLoading: isLoading || !isInitialized,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        refreshUser
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}