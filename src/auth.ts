import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { eq } from "drizzle-orm"
import { users } from "@/db/schema"
import { verifyPassword } from "@/lib/hash"
import { z } from "zod"

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: { strategy: "jwt" }, // Credentials provider requires JWT strategy
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const { email, password } = await signInSchema.parseAsync(credentials)

                const user = await db.query.users.findFirst({
                    where: eq(users.email, email)
                })

                if (!user || !user.password) {
                    return null // User not found or no password set (OAuth user)
                }

                const isValid = await verifyPassword(password, user.password)

                if (!isValid) return null

                return user
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            return session
        }
    }
})
