import { getCurrentUserServer } from "./lib/actions" // Import the server action
import { AuthProvider } from "./lib/auth-context"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "JWT Auth with Next.js & Django",
    description: "Demonstrating JWT authentication flow.",
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const initialUser = await getCurrentUserServer()

    return (
        <html lang="en">
            <body>
                <AuthProvider initialUser={initialUser}>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
