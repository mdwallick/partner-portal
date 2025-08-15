import { OpenFgaApi, Configuration, CredentialsMethod } from "@openfga/sdk"

// Initialize FGA client
const fgaClient = new OpenFgaApi(
  new Configuration({
    apiUrl: process.env.FGA_API_URL || "https://api.fga.example",
    storeId: process.env.FGA_STORE_ID || "",
    credentials: {
      method: CredentialsMethod.ClientCredentials,
      config: {
        apiTokenIssuer: process.env.FGA_API_TOKEN_ISSUER || "",
        apiAudience: process.env.FGA_API_AUDIENCE || "",
        clientId: process.env.FGA_CLIENT_ID || "",
        clientSecret: process.env.FGA_CLIENT_SECRET || "",
      },
    },
  })
)

// Cache for the latest authorization model ID
let cachedModelId: string | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Function to get the latest authorization model ID
export async function getLatestAuthorizationModelId(): Promise<string> {
  const now = Date.now()

  // Return cached value if still valid
  if (cachedModelId && now < cacheExpiry) {
    return cachedModelId
  }

  try {
    console.log("🔍 Fetching latest FGA authorization model...")
    const response = await fgaClient.readAuthorizationModels()

    if (!response.authorization_models || response.authorization_models.length === 0) {
      throw new Error("No authorization models found")
    }

    // Get the most recent model (they're sorted by creation time, newest first)
    const latestModel = response.authorization_models[0]
    cachedModelId = latestModel.id || ""
    cacheExpiry = now + CACHE_DURATION

    console.log(`🔍 Using latest FGA model: ${cachedModelId}`)
    return cachedModelId
  } catch (error) {
    console.error("❌ Failed to fetch latest FGA authorization model:", error)

    // Fallback to environment variable if available
    const fallbackModelId = process.env.FGA_AUTHORIZATION_MODEL_ID
    if (fallbackModelId) {
      console.log(`⚠️ Falling back to environment model ID: ${fallbackModelId}`)
      return fallbackModelId
    }

    throw new Error("No FGA authorization model available")
  }
}

// Legacy export for backward compatibility (deprecated)
export const FGA_AUTHORIZATION_MODEL_ID = process.env.FGA_AUTHORIZATION_MODEL_ID || ""

export { fgaClient }

// Helper functions for FGA operations
export async function checkPermission(
  user: string,
  relation: string,
  object: string
): Promise<boolean> {
  try {
    const modelId = await getLatestAuthorizationModelId()
    const response = await fgaClient.check({
      authorization_model_id: modelId,
      tuple_key: {
        user,
        relation,
        object,
      },
    })
    return response.allowed || false
  } catch (error) {
    console.error("FGA check error:", error)
    return false
  }
}

export async function writeTuple(user: string, relation: string, object: string): Promise<boolean> {
  try {
    const modelId = await getLatestAuthorizationModelId()
    await fgaClient.write({
      authorization_model_id: modelId,
      writes: {
        tuple_keys: [
          {
            user,
            relation,
            object,
          },
        ],
      },
    })
    return true
  } catch (error) {
    console.error("FGA write error:", error)
    return false
  }
}

export async function deleteTuple(
  user: string,
  relation: string,
  object: string
): Promise<boolean> {
  try {
    const modelId = await getLatestAuthorizationModelId()
    await fgaClient.write({
      authorization_model_id: modelId,
      deletes: {
        tuple_keys: [
          {
            user,
            relation,
            object,
          },
        ],
      },
    })
    return true
  } catch (error) {
    console.error("FGA delete error:", error)
    return false
  }
}

export async function deleteTuples(
  tuples: Array<{ user: string; relation: string; object: string }>
): Promise<boolean> {
  try {
    if (tuples.length === 0) {
      return true
    }

    const modelId = await getLatestAuthorizationModelId()
    await fgaClient.write({
      authorization_model_id: modelId,
      deletes: {
        tuple_keys: tuples,
      },
    })
    return true
  } catch (error) {
    console.error("FGA bulk delete error:", error)
    return false
  }
}

export async function listObjects(
  user: string,
  relation: string,
  objectType: string
): Promise<string[]> {
  try {
    const modelId = await getLatestAuthorizationModelId()
    const response = await fgaClient.listObjects({
      authorization_model_id: modelId,
      user,
      relation,
      type: objectType,
    })

    // Extract object IDs from the response
    // The response contains objects in format like "partner:uuid"
    // We need to extract just the UUID part
    const objects = response.objects || []
    return objects.map(obj => {
      // Extract the ID part after the colon (e.g., "partner:uuid" -> "uuid")
      const parts = obj.split(":")
      return parts.length > 1 ? parts[1] : obj
    })
  } catch (error) {
    console.error("FGA listObjects error:", error)
    return []
  }
}
