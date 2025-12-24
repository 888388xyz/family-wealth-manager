import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

// Public paths that don't require authentication
const publicPaths = ["/login", "/register", "/api/auth"]

export default auth((req) => {
    const { pathname } = req.nextUrl
    const isLoggedIn = !!req.auth

    // Check if the path is public
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // Allow public paths
    if (isPublicPath) {
        // If logged in and trying to access login/register, redirect to dashboard
        if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
            return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
        }
        return NextResponse.next()
    }

    // Redirect to login if not authenticated
    if (!isLoggedIn) {
        const loginUrl = new URL("/login", req.nextUrl)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|avatars|.*\\..*).*)"],
}
