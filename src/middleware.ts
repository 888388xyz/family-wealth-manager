import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/accounts/:path*",
        "/settings/:path*",
        "/users/:path*",
        "/audit/:path*",
        "/goals/:path*",
        "/trends/:path*",
    ],
}
