const fs = require("fs")

async function testOktaConnection() {
  try {
    console.log("🔍 Testing Okta Connection")
    console.log("==========================")

    // Load environment variables from .env.local
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
      "- OKTA_ISSUER:",
      process.env.OKTA_ISSUER ? `✅ Set (${process.env.OKTA_ISSUER})` : "❌ Not set"
    )
    console.log("- OKTA_CLIENT_ID:", process.env.OKTA_CLIENT_ID ? "✅ Set" : "❌ Not set")
    console.log("- OKTA_CLIENT_SECRET:", process.env.OKTA_CLIENT_SECRET ? "✅ Set" : "❌ Not set")
    console.log("- OKTA_REDIRECT_URI:", process.env.OKTA_REDIRECT_URI ? "✅ Set" : "❌ Not set")
    console.log("- OKTA_API_TOKEN:", process.env.OKTA_API_TOKEN ? "✅ Set" : "❌ Not set")

    // Validate issuer format
    if (process.env.OKTA_ISSUER) {
      const issuer = process.env.OKTA_ISSUER
      if (
        !issuer.includes(".okta.com") &&
        !issuer.includes(".oktapreview.com") &&
        !issuer.includes(".okta-emea.com")
      ) {
        console.log("⚠️  Warning: OKTA_ISSUER should be in format: https://your-tenant.okta.com")
      }
    }

    console.log("\n🔧 Testing Okta API access...")

    // Test basic API access
    if (process.env.OKTA_ISSUER && process.env.OKTA_API_TOKEN) {
      try {
        const response = await fetch(`${process.env.OKTA_ISSUER}/api/v1/users/me`, {
          headers: {
            Authorization: `SSWS ${process.env.OKTA_API_TOKEN}`,
            Accept: "application/json",
          },
        })

        if (response.ok) {
          console.log("✅ Okta API access working!")
        } else {
          console.log(`❌ Okta API access failed: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.log("❌ Okta API access failed:", error.message)
      }
    } else {
      console.log("⚠️  Skipping API test - missing required environment variables")
    }

    console.log("\n🎯 Next Steps:")
    console.log("1. Configure your Okta application with the correct redirect URI")
    console.log("2. Set up your Auth0 FGA store and model")
    console.log("3. Run the application with: npm run dev")
  } catch (error) {
    console.error("\n❌ Test failed with error:", error.message)
  }
}

testOktaConnection()
