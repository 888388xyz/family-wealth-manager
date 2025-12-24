import { type DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
        } & DefaultSession["user"]
    }
}

import type { NextAuthConfig } from "next-auth"

export default {
    providers: [],
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
            }
            return token
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
                session.user.role = token.role as string
            }
            return session
        }
    }
} satisfies NextAuthConfig

