"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { hashPassword } from "@/lib/hash"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function registerAction(formData: FormData) {
    return { error: "注册功能已关闭，请联系管理员开通账号" }
}
