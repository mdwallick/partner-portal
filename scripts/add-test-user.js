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
const { v4: uuidv4 } = require("uuid")
const sql = neon(process.env.DATABASE_URL)

async function addTestUser() {
  try {
    console.log("Adding test user to database...\n")

    const partnerId = "d87b44a4-f024-4dae-9ebd-be4c89857f7e"

    // Create a test user
    const userId = uuidv4()
    const testEmail = "test@example.com"
    const dummyAuth0Id = "auth0|test-user-id"

    console.log("1. Creating test user...")
    await sql`
      INSERT INTO users (id, auth0_user_id, email, display_name)
      VALUES (${userId}, ${dummyAuth0Id}, ${testEmail}, ${"Test User"})
    `
    console.log(`✅ Created user: ${testEmail} (${userId})`)

    // Add user to partner
    const partnerUserId = uuidv4()
    console.log("\n2. Adding user to partner...")
    await sql`
      INSERT INTO partner_users (id, partner_id, user_id, role, status, invited_by)
      VALUES (${partnerUserId}, ${partnerId}, ${userId}, 'partner_admin', 'active', ${null})
    `
    console.log(`✅ Added user to partner as admin`)

    // Verify the addition
    console.log("\n3. Verifying the addition...")
    const teamMembers = await sql`
      SELECT 
        pu.id,
        pu.role,
        pu.status,
        pu.invited_at,
        pu.joined_at,
        pu.created_at,
        u.email,
        u.display_name,
        u.auth0_user_id
      FROM partner_users pu
      JOIN users u ON pu.user_id = u.id
      WHERE pu.partner_id = ${partnerId}
      ORDER BY pu.created_at DESC
    `

    console.log(`✅ Found ${teamMembers.length} team member(s):`)
    teamMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.email} (${member.role}) - ${member.status}`)
    })

    console.log("\n✅ Test user added successfully!")
    console.log("You can now test the team members page.")
  } catch (error) {
    console.error("❌ Failed to add test user:", error)
  }
}

addTestUser()
