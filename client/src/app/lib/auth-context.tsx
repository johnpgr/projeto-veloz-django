'use client'

import React from 'react'
// User type might still be needed from auth.ts if not redefined or imported from actions.ts
import type { User, UpdateProfileData } from './auth' 
import { getCurrentUserServer, logoutAction, updateProfileAction, ActionResponse } from './actions' // Import server actions

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    // login, register are removed as forms will call server actions directly
    logout: () => Promise<void>
    // updateProfile might become a server action too
    updateProfile: (userData: UpdateProfileData) => Promise<ActionResponse> // Keep or convert to server action
    refreshUser: () => Promise<void> // This will now call getCurrentUserServer
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: React.ReactNode
    initialUser: User | null // Allow passing initial user from server component
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
    const [user, setUser] = React.useState<User | null>(initialUser)
    const [isLoading, setIsLoading] = React.useState(!initialUser) // If initialUser is provided, not loading initially for that.

    const isAuthenticated = !!user

    const fetchCurrentUser = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const currentUser = await getCurrentUserServer()
            setUser(currentUser)
        } catch (error) {
            console.error('Auth check/refresh failed:', error)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Check user on mount if no initial user was provided,
    // or to re-verify/refresh if needed.
    React.useEffect(() => {
        if (!initialUser) {
            console.log('No initial user, fetching current user...')
            fetchCurrentUser()
        }
    }, [initialUser, fetchCurrentUser])


    const handleLogout = async () => {
        setIsLoading(true)
        try {
            await logoutAction() // Call the server action
            setUser(null)
            // Re-fetching user or relying on redirect from action/middleware
            // Forcing a page reload might be an option to ensure clean state via middleware
            window.location.href = '/auth' // Or rely on middleware to redirect
        } catch (error) {
            console.error('Logout failed:', error)
            // Potentially show an error to the user
        } finally {
            setIsLoading(false)
        }
    }

    // updateProfile would ideally also be a server action.
    // For now, assuming it might still use a client-side fetch or a new server action.
    const handleUpdateProfile = async (userData: UpdateProfileData): Promise<ActionResponse> => {
        setIsLoading(true);
        try {
            // Create FormData to pass to the server action
            const formData = new FormData();
            if (userData.email !== undefined) formData.append('email', userData.email);
            if (userData.first_name !== undefined) formData.append('first_name', userData.first_name);
            if (userData.last_name !== undefined) formData.append('last_name', userData.last_name);
            // Add other fields as necessary

            const result = await updateProfileAction(undefined, formData);
            
            if (result.success && result.user) {
                setUser(result.user);
                // Optionally, trigger a broader refresh if other parts of the app need to update
                // await refreshUser(); // Or rely on revalidatePath in action
            } else if (!result.success && result.error) {
                console.error('Update profile failed:', result.error);
                // Propagate error to be handled by the calling component
            }
            return result;
        } catch (error: any) {
            console.error('Error in handleUpdateProfile:', error);
            return { success: false, error: error.message || 'Failed to update profile.' };
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        await fetchCurrentUser()
    }

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        refreshUser,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
