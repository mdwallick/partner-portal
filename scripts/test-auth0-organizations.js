const { ManagementClient } = require("auth0")

async function testAuth0Organizations() {
  try {
    console.log("Testing Auth0 Organizations API...")
    console.log("Environment variables:")
    console.log("- AUTH0_DOMAIN:", process.env.AUTH0_DOMAIN ? "Set" : "Not set")
    console.log(
      "- AUTH0_MANAGEMENT_CLIENT_ID:",
      process.env.AUTH0_MANAGEMENT_CLIENT_ID ? "Set" : "Not set"
    )
    console.log(
      "- AUTH0_MANAGEMENT_CLIENT_SECRET:",
      process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ? "Set" : "Not set"
    )

    // Initialize Auth0 Management API client
    const managementClient = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
    })

    console.log("\nFetching organizations...")

    // Get all organizations
    const organizations = await managementClient.organizations.getAll()

    console.log("\n✅ Success! Found organizations:")
    console.log("Total organizations:", organizations.data.length)

    if (organizations.data.length === 0) {
      console.log("No organizations found yet.")
    } else {
      organizations.data.forEach((org, index) => {
        console.log(`\n${index + 1}. Organization:`)
        console.log(`   ID: ${org.id}`)
        console.log(`   Name: ${org.name}`)
        console.log(`   Display Name: ${org.display_name || "Not set"}`)
        console.log(`   Created: ${org.created_at}`)
        console.log(`   Updated: ${org.updated_at}`)
        if (org.metadata && Object.keys(org.metadata).length > 0) {
          console.log(`   Metadata:`, org.metadata)
        }
      })
    }
  } catch (error) {
    console.error("\n❌ Error testing Auth0 Organizations:")
    console.error("Error message:", error.message)

    if (error.statusCode) {
      console.error("Status code:", error.statusCode)
    }

    if (error.originalError) {
      console.error("Original error:", error.originalError)
    }

    // Common error troubleshooting
    if (error.message.includes("Invalid client")) {
      console.error(
        "\n💡 Troubleshooting: Check your AUTH0_MANAGEMENT_CLIENT_ID and AUTH0_MANAGEMENT_CLIENT_SECRET"
      )
    } else if (error.message.includes("Insufficient scope")) {
      console.error(
        "\n💡 Troubleshooting: Make sure your app has the required organization scopes authorized"
      )
    } else if (error.message.includes("Organizations not enabled")) {
      console.error("\n💡 Troubleshooting: Enable Organizations feature in your Auth0 dashboard")
    }
  }
}

// Load environment variables from .env.local
const fs = require("fs")
const path = require("path")

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

testAuth0Organizations()
