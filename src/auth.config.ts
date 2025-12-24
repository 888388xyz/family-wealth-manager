import type { NextAuthConfig } from "next-auth"

export default {
    providers: [],
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            return session
        }
    }
} satisfies NextAuthConfig

