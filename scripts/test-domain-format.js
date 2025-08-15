const { ManagementClient } = require("auth0")

async function testDomainFormat() {
  try {
    console.log("🔍 Testing Auth0 Domain Format")
    console.log("==============================")

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

    const envVars = loadEnvFile(".env.local")
    Object.keys(envVars).forEach(key => {
      process.env[key] = envVars[key]
    })

    console.log("\n📋 Current AUTH0_DOMAIN:", process.env.AUTH0_DOMAIN)

    // Check if domain has https:// prefix
    let domain = process.env.AUTH0_DOMAIN
    if (domain && domain.startsWith("https://")) {
      console.log("⚠️  Domain has https:// prefix, removing it...")
      domain = domain.replace("https://", "")
      console.log("📋 Corrected domain:", domain)
    }

    if (domain && domain.startsWith("http://")) {
      console.log("⚠️  Domain has http:// prefix, removing it...")
      domain = domain.replace("http://", "")
      console.log("📋 Corrected domain:", domain)
    }

    // Validate domain format
    if (domain && !domain.includes(".auth0.com") && !domain.includes(".us.auth0.com")) {
      console.log(
        "❌ Invalid domain format. Should be: your-tenant.auth0.com or your-tenant.us.auth0.com"
      )
      return
    }

    console.log("\n🔧 Testing with corrected domain...")

    // Initialize Auth0 Management API client with corrected domain
    const managementClient = new ManagementClient({
      domain: domain,
      clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
    })

    console.log("✅ Management client initialized")

    console.log("\n🧪 Testing organizations access...")

    // Try to get organizations
    const organizations = await managementClient.organizations.getAll()

    console.log("\n✅ Organizations API working!")
    console.log(`Total organizations: ${organizations.data.length}`)

    if (organizations.data.length === 0) {
      console.log("📝 No organizations found yet.")
    } else {
      console.log("\n📋 Existing Organizations:")
      organizations.data.forEach((org, index) => {
        console.log(`\n${index + 1}. ${org.name} (${org.id})`)
        console.log(`   Display Name: ${org.display_name || "Not set"}`)
        console.log(`   Created: ${new Date(org.created_at).toLocaleString()}`)
      })
    }

    console.log("\n🎉 Domain format is correct!")
    console.log("\n💡 If this worked, update your .env.local file:")
    console.log(`AUTH0_DOMAIN=${domain}`)
  } catch (error) {
    console.error("\n❌ Test failed with error:")
    console.error("Error message:", error.message)

    if (error.statusCode) {
      console.error("Status code:", error.statusCode)
    }

    console.log("\n🔍 Additional troubleshooting:")
    console.log("1. Make sure your Auth0 tenant has Organizations enabled")
    console.log("2. Verify your Management API client has the required scopes")
    console.log("3. Check that your client is authorized for the Management API")
  }
}

testDomainFormat()
