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

// Initialize database connection
const { neon } = require("@neondatabase/serverless")
const sql = neon(process.env.DATABASE_URL)

async function testUserExists() {
  try {
    console.log("Testing if user exists in database...")

    const auth0UserId = "google-oauth2|103437188793489113148"

    const users = await sql`
      SELECT * FROM users WHERE auth0_user_id = ${auth0UserId}
    `

    if (users.length > 0) {
      console.log("✅ User found:", users[0])
    } else {
      console.log("❌ User not found, creating...")

      // Create the user
      const userId = require("uuid").v4()
      await sql`
        INSERT INTO users (id, auth0_user_id, email, display_name)
        VALUES (${userId}, ${auth0UserId}, 'admin@example.com', 'Super Admin')
      `

      console.log("✅ User created successfully")
    }
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

testUserExists()
