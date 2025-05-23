import { fetchAPI } from './api'

export interface User {
    id: string
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    date_joined: string
}

export interface AuthTokens {
    access: string
    refresh: string
}

export interface LoginResponse {
    access: string
    refresh: string
    user: User
}

export interface RegisterData {
    username: string
    email: string
    password: string
    password_confirm: string
    first_name?: string
    last_name?: string
}

export interface LoginData {
    username: string
    password: string
}

export interface UpdateProfileData {
    email?: string;
    first_name?: string;
    last_name?: string;
    // Add other updatable fields from User interface if necessary
}

// Authentication API functions
export class AuthAPI {
    // Login user
    static async login(credentials: LoginData): Promise<LoginResponse> {
        const response = await fetchAPI<LoginResponse>('/auth/login/', {
            method: 'POST',
            body: JSON.stringify(credentials),
        })
        
        // Store tokens in localStorage
        if (response.access && response.refresh) {
            this.setTokens({
                access: response.access,
                refresh: response.refresh,
            })
        }
        
        return response
    }

    // Register new user
    static async register(userData: RegisterData): Promise<LoginResponse> {
        const response = await fetchAPI<LoginResponse>('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData),
        })
        
        // Store tokens in localStorage
        if (response.access && response.refresh) {
            this.setTokens({
                access: response.access,
                refresh: response.refresh,
            })
        }
        
        return response
    }

    // Logout user
    static async logout(): Promise<void> {
        const refreshToken = this.getRefreshToken()
        
        if (refreshToken) {
            try {
                await fetchAPI('/auth/logout/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.getAccessToken()}`,
                    },
                    body: JSON.stringify({ refresh: refreshToken }),
                })
            } catch (error) {
                console.error('Error during logout:', error)
            }
        }
        
        // Clear tokens from localStorage
        this.clearTokens()
    }

    // Get current user info
    static async getCurrentUser(): Promise<User> {
        return fetchAPI<User>('/auth/user/', {
            headers: {
                'Authorization': `Bearer ${this.getAccessToken()}`,
            },
        })
    }

    // Update user profile
    static async updateProfile(userData: Partial<User>): Promise<User> {
        return fetchAPI<User>('/auth/profile/', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.getAccessToken()}`,
            },
            body: JSON.stringify(userData),
        })
    }

    // Refresh access token
    static async refreshToken(): Promise<{ access: string }> {
        const refreshToken = this.getRefreshToken()
        
        if (!refreshToken) {
            throw new Error('No refresh token available')
        }

        const response = await fetchAPI<{ access: string }>('/auth/refresh/', {
            method: 'POST',
            body: JSON.stringify({ refresh: refreshToken }),
        })

        // Update access token in localStorage
        localStorage.setItem('access_token', response.access)
        
        return response
    }

    // Token management
    static setTokens(tokens: AuthTokens): void {
        localStorage.setItem('access_token', tokens.access)
        localStorage.setItem('refresh_token', tokens.refresh)
    }

    static getAccessToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('access_token')
    }

    static getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('refresh_token')
    }

    static clearTokens(): void {
        if (typeof window === 'undefined') return
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    }

    static isAuthenticated(): boolean {
        return !!this.getAccessToken()
    }

    // Check if token is expired (basic check, doesn't verify signature)
    static isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const currentTime = Date.now() / 1000
            return payload.exp < currentTime
        } catch (error) {
            return true
        }
    }

    // Automatically refresh token if needed
    static async ensureValidToken(): Promise<string | null> {
        const accessToken = this.getAccessToken()
        
        if (!accessToken) {
            return null
        }

        // If token is expired, try to refresh it
        if (this.isTokenExpired(accessToken)) {
            try {
                const response = await this.refreshToken()
                return response.access
            } catch (error) {
                // If refresh fails, clear tokens and redirect to login
                this.clearTokens()
                return null
            }
        }

        return accessToken
    }
}

// Enhanced fetchAPI with automatic token handling
export async function authenticatedFetch<T = any>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    // Ensure we have a valid token
    const token = await AuthAPI.ensureValidToken()
    
    if (!token) {
        throw new Error('Not authenticated')
    }

    // Add authorization header
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    }

    return fetchAPI<T>(endpoint, { ...options, headers })
}
