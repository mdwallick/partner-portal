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

async function testPartnerUsers() {
  try {
    console.log("Testing partner users functionality...\n")

    const partnerId = "d87b44a4-f024-4dae-9ebd-be4c89857f7e"

    // Check if partner exists
    console.log("1. Checking if partner exists...")
    const partners = await sql`
      SELECT * FROM partners WHERE id = ${partnerId}
    `

    if (partners.length === 0) {
      console.log("❌ Partner not found!")
      return
    }

    const partner = partners[0]
    console.log(`✅ Partner found: ${partner.name} (${partner.id})`)
    console.log(`   Type: ${partner.type}`)
    console.log(`   Organization ID: ${partner.organization_id || "None"}`)
    console.log(`   Created: ${partner.created_at}\n`)

    // Check if partner_users table exists
    console.log("2. Checking partner_users table...")
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'partner_users'
    `

    if (tables.length === 0) {
      console.log("❌ partner_users table not found!")
      return
    }

    console.log("✅ partner_users table exists\n")

    // Check for existing team members
    console.log("3. Checking existing team members...")
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

    if (teamMembers.length === 0) {
      console.log("ℹ️  No team members found for this partner")
    } else {
      console.log(`✅ Found ${teamMembers.length} team member(s):`)
      teamMembers.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.email} (${member.role}) - ${member.status}`)
      })
    }

    console.log("\n4. Checking users table...")
    const users = await sql`
      SELECT * FROM users LIMIT 5
    `

    console.log(`✅ Found ${users.length} user(s) in database`)
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.auth0_user_id || "No Auth0 ID"})`)
    })

    console.log("\n✅ Database connection and queries working correctly!")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testPartnerUsers()
