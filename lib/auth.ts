import { auth0 } from "@/lib/auth0"

export interface AuthenticatedUser {
  sub: string
  email: string
  name?: string
  nickname?: string
  picture?: string
  email_verified: boolean
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth0.getSession()
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

export async function requireAuth(): Promise<AuthenticatedUser> {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      console.log("🚫 Authentication required - no valid session found")
      throw new Error("Authentication required - please log in")
    }

    console.log(`👤 Authenticated user: ${user.email} (${user.sub})`)
    return user
  } catch (error) {
    console.log("🚫 Authentication required - no valid session found", error)
    throw new Error("Authentication required - please log in")
  }
}
