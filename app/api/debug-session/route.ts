import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"

export async function GET() {
  try {
    // Get the access token from Auth0
    const session = await auth0.getSession()
    const accessToken = session?.tokenSet.accessToken
    const idToken = session?.tokenSet.idToken
    const refreshToken = session?.tokenSet.refreshToken

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "No access token found",
          message: "You need to be logged in to see session data",
        },
        { status: 401 }
      )
    }

    // Get user info from Auth0
    const userInfo = {
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture,
      sub: session.user.sub,
      updated_at: session.user.updated_at,
      created_at: session.user.created_at,
      email_verified: session.user.email_verified,
    }

    // Return the session data
    return NextResponse.json({
      success: true,
      session: {
        user: userInfo,
        accessToken: accessToken,
        idToken: idToken,
        refreshToken: refreshToken,
      },
      tokens: {
        accessToken: accessToken,
        idToken: idToken,
        refreshToken: refreshToken,
      },
    })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json(
      {
        error: "Failed to get session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
