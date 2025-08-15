const { ManagementClient } = require("auth0")

async function testCreateOrganization() {
  try {
    console.log("🧪 Testing Auth0 Organization Creation")
    console.log("=====================================")

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

    // Initialize Auth0 Management API client (same as in lib/auth0-management.ts)
    const getDomain = () => {
      let domain = process.env.AUTH0_DOMAIN
      if (!domain) {
        throw new Error("AUTH0_DOMAIN is not set")
      }
      // Remove protocol if present (Management API expects domain only)
      if (domain.startsWith("https://")) {
        domain = domain.replace("https://", "")
      }
      if (domain.startsWith("http://")) {
        domain = domain.replace("http://", "")
      }
      return domain
    }

    const managementClient = new ManagementClient({
      domain: getDomain(),
      clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
    })

    console.log("\n🔧 Management client initialized")
    console.log("Domain used:", getDomain())

    // Test data (simulating partner creation)
    const testPartnerName = "Test Partner " + Date.now()
    const testPartnerId = "test-partner-" + Date.now()
    const testPartnerType = "game_studio"

    console.log("\n🧪 Creating test organization...")
    console.log("Partner Name:", testPartnerName)
    console.log("Partner ID:", testPartnerId)
    console.log("Partner Type:", testPartnerType)

    // Convert name to valid organization name format (same as in lib/auth0-management.ts)
    const validName = testPartnerName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    console.log("Valid Organization Name:", validName)

    // Create organization (same as createAuth0Organization function)
    const response = await managementClient.organizations.create({
      name: validName,
      display_name: testPartnerName,
      metadata: {
        partner_id: testPartnerId,
        partner_type: testPartnerType,
      },
    })

    console.log("\n✅ Organization created successfully!")
    console.log("Organization ID:", response.data.id)
    console.log("Organization Name:", response.data.name)
    console.log("Display Name:", response.data.display_name)
    console.log("Metadata:", response.data.metadata)
    console.log("Created At:", response.data.created_at)

    // List all organizations to confirm
    console.log("\n📋 Current organizations:")
    const organizations = await managementClient.organizations.getAll()
    organizations.data.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name} (${org.id})`)
    })

    console.log("\n🎉 Test completed successfully!")
  } catch (error) {
    console.error("\n❌ Test failed with error:")
    console.error("Error message:", error.message)

    if (error.statusCode) {
      console.error("Status code:", error.statusCode)
    }

    if (error.originalError) {
      console.error("Original error:", error.originalError)
    }

    console.log("\n🔍 Error details:")
    console.log("Error type:", error.constructor.name)
    console.log("Error stack:", error.stack)
  }
}

testCreateOrganization()
