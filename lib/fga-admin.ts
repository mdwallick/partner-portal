import { fgaClient, getLatestAuthorizationModelId } from "./fga"

export async function setupSuperAdmin(userId: string) {
  const tuples = [
    {
      user: `user:${userId}`,
      relation: "super_admin",
      object: "platform:main",
    },
  ]

  try {
    const modelId = await getLatestAuthorizationModelId()
    const response = await fgaClient.write({
      writes: {
        tuple_keys: tuples,
      },
      authorization_model_id: modelId,
    })

    console.log("Super admin tuples created successfully:", response)
    return response
  } catch (error) {
    console.error("Error creating super admin tuples:", error)
    throw error
  }
}

export async function checkSuperAdminAccess(userId: string) {
  try {
    const modelId = await getLatestAuthorizationModelId()
    const response = await fgaClient.check({
      tuple_key: {
        user: `user:${userId}`,
        relation: "super_admin",
        object: "platform:main",
      },
      authorization_model_id: modelId,
    })

    return response.allowed
  } catch (error) {
    console.error("Error checking super admin access:", error)
    return false
  }
}
