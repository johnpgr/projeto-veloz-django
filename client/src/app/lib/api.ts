const IS_PRODUCTION = process.env.NODE_ENV === "production"

// The Django backend service is named 'server' in docker-compose.yml and listens on port 8000.
// For local development (outside Docker or when Docker server is mapped to localhost),
const API_BASE_URL = IS_PRODUCTION
    ? "http://server:8000/api" // Adjust '/api' if your Django URLs have a different prefix
    : "http://localhost:8000/api" // Adjust '/api' accordingly

/**
 * A generic fetch wrapper for making API requests.
 * @param endpoint The API endpoint to call (e.g., '/users', '/products/1').
 * @param options Optional fetch options (method, headers, body, etc.).
 * @returns Promise<T> The JSON response from the API.
 */
export async function fetchAPI<T = any>(
    endpoint: string,
    options: RequestInit = {},
    next: NextFetchRequestConfig = {},
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const defaultHeaders: HeadersInit = {
        "Content-Type": "application/json",
    }

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        next,
    }

    try {
        const response = await fetch(url, config)

        if (!response.ok) {
            // Attempt to parse error response from Django
            let errorData
            try {
                errorData = await response.json()
            } catch (e) {
                // If response is not JSON, use status text
                errorData = { message: response.statusText }
            }
            console.error("API Error:", response.status, errorData)
            throw new Error(
                errorData.detail ||
                    errorData.message ||
                    `API request failed with status ${response.status}`,
            )
        }

        // Handle cases where the response might be empty (e.g., 204 No Content)
        if (response.status === 204) {
            return undefined as T
        }

        return (await response.json()) as T
    } catch (error) {
        console.error("Fetch API Error:", error)
        throw error // Re-throw the error to be caught by the caller
    }
}
