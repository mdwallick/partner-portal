import { NextRequest } from "next/server"
import { getSession } from "@auth0/nextjs-auth0"

export interface AuthenticatedUser {
  sub: string
  email: string
  name?: string
  nickname?: string
  picture?: string
  email_verified: boolean
}

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const res = new Response()
    const session = await getSession(req as any, res as any)
    const user = session?.user
    if (!user) return null
    return {
      sub: user.sub as string,
      email: (user.email as string) || "",
      name: user.name as string,
      nickname: user.nickname as string,
      picture: user.picture as string,
      email_verified: Boolean(user.email_verified),
    }
  } catch (error) {
    console.error("Error getting authenticated user:", error)
    return null
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  try {
    const user = await getAuthenticatedUser(req)

    if (!user) {
      console.log("🚫 Authentication required - no valid session found")
      throw new Error("Authentication required - please log in")
    }

    console.log(`👤 Authenticated user: ${user.email} (${user.sub})`)
    return user
  } catch (error) {
    console.log("🚫 Authentication required - no valid session found")
    throw new Error("Authentication required - please log in")
  }
}
