const { ManagementClient } = require("auth0")

async function testAuth0Detailed() {
  try {
    console.log("🔍 Detailed Auth0 Management API Test")
    console.log("=====================================")

    // Check environment variables
    console.log("\n📋 Environment Variables Check:")
    console.log(
      "- AUTH0_DOMAIN:",
      process.env.AUTH0_DOMAIN ? `✅ Set (${process.env.AUTH0_DOMAIN})` : "❌ Not set"
    )
    console.log(
      "- AUTH0_MANAGEMENT_CLIENT_ID:",
      process.env.AUTH0_MANAGEMENT_CLIENT_ID ? "✅ Set" : "❌ Not set"
    )
    console.log(
      "- AUTH0_MANAGEMENT_CLIENT_SECRET:",
      process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ? "✅ Set" : "❌ Not set"
    )

    // Validate domain format
    if (process.env.AUTH0_DOMAIN) {
      const domain = process.env.AUTH0_DOMAIN
      if (!domain.includes(".auth0.com") && !domain.includes(".us.auth0.com")) {
        console.log("⚠️  Warning: AUTH0_DOMAIN should be in format: your-tenant.auth0.com")
      }
    }

    console.log("\n🔧 Initializing Management Client...")

    // Initialize Auth0 Management API client
    const managementClient = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
    })

    console.log("✅ Management client initialized")

    console.log("\n🧪 Testing basic API access...")

    // Try a simple API call first
    console.log("Testing: Get applications...")
    const applications = await managementClient.applications.getAll()
    console.log("✅ Applications API working!")
    console.log(`   Found ${applications.data.length} applications`)

    console.log("\n🧪 Testing organizations access...")

    // Try to get organizations
    console.log("Testing: Get organizations...")
    const organizations = await managementClient.organizations.getAll()

    console.log("\n✅ Organizations API working!")
    console.log(`Total organizations: ${organizations.data.length}`)

    if (organizations.data.length === 0) {
      console.log("📝 No organizations found yet. This is normal if you haven't created any.")
    } else {
      console.log("\n📋 Existing Organizations:")
      organizations.data.forEach((org, index) => {
        console.log(`\n${index + 1}. ${org.name} (${org.id})`)
        console.log(`   Display Name: ${org.display_name || "Not set"}`)
        console.log(`   Created: ${new Date(org.created_at).toLocaleString()}`)
        if (org.metadata && Object.keys(org.metadata).length > 0) {
          console.log(`   Metadata:`, org.metadata)
        }
      })
    }

    console.log("\n🎉 All tests passed! Your Auth0 Management API is configured correctly.")
  } catch (error) {
    console.error("\n❌ Test failed with error:")
    console.error("Error message:", error.message)

    if (error.statusCode) {
      console.error("Status code:", error.statusCode)
    }

    if (error.originalError) {
      console.error("Original error:", error.originalError)
    }

    console.log("\n🔍 Troubleshooting Guide:")

    if (error.message.includes("fetch failed") || error.message.includes("network")) {
      console.log("🌐 Network Issue:")
      console.log("   - Check your internet connection")
      console.log("   - Verify AUTH0_DOMAIN is correct")
      console.log("   - Try: ping " + (process.env.AUTH0_DOMAIN || "your-domain.auth0.com"))
    }

    if (error.message.includes("Invalid client") || error.statusCode === 401) {
      console.log("🔑 Authentication Issue:")
      console.log("   - Check AUTH0_MANAGEMENT_CLIENT_ID and AUTH0_MANAGEMENT_CLIENT_SECRET")
      console.log("   - Verify the client is authorized for Management API")
      console.log("   - Make sure the client has the required scopes")
    }

    if (error.message.includes("Insufficient scope") || error.statusCode === 403) {
      console.log("🔒 Permission Issue:")
      console.log("   - Your app needs these scopes:")
      console.log("     * read:organizations")
      console.log("     * create:organizations")
      console.log("     * update:organizations")
      console.log("     * delete:organizations")
      console.log("   - Go to Auth0 Dashboard → Applications → APIs → Auth0 Management API")
      console.log("   - Authorize your app with the required scopes")
    }

    if (error.message.includes("Organizations not enabled")) {
      console.log("🏢 Organizations Feature:")
      console.log("   - Enable Organizations in Auth0 Dashboard")
      console.log("   - Go to Auth0 Dashboard → Organizations")
    }
  }
}

// Load environment variables from .env.local
const fs = require("fs")

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, "utf8")
    const envVars = {}

    envContent.split("\n").forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=")
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^['"]|['"]$/g, "")
          envVars[key] = value
        }
      }
    })

    return envVars
  } catch (error) {
    console.error("Error loading .env.local file:", error.message)
    return {}
  }
}

// Load environment variables
const envVars = loadEnvFile(".env.local")
Object.keys(envVars).forEach(key => {
  process.env[key] = envVars[key]
})

testAuth0Detailed()
