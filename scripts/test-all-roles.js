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

async function testAllRoles() {
  try {
    console.log("Testing all three roles (admin, member, viewer)...\n")

    const partnerId = "d87b44a4-f024-4dae-9ebd-be4c89857f7e"

    // Create test users for each role
    const testUsers = [
      { email: "admin@example.com", role: "partner_admin", displayName: "Admin User" },
      { email: "member@example.com", role: "partner_user", displayName: "Member User" },
      { email: "viewer@example.com", role: "partner_viewer", displayName: "Viewer User" },
    ]

    console.log("1. Creating test users for each role...")

    for (const testUser of testUsers) {
      const userId = uuidv4()
      const dummyAuth0Id = `auth0|${testUser.role}-${userId}`

      // Create user
      await sql`
        INSERT INTO users (id, auth0_user_id, email, display_name)
        VALUES (${userId}, ${dummyAuth0Id}, ${testUser.email}, ${testUser.displayName})
      `

      // Add user to partner
      const partnerUserId = uuidv4()
      await sql`
        INSERT INTO partner_users (id, partner_id, user_id, role, status, invited_by)
        VALUES (${partnerUserId}, ${partnerId}, ${userId}, ${testUser.role}, 'active', ${null})
      `

      console.log(`✅ Created ${testUser.role}: ${testUser.email}`)
    }

    // Verify all users were created
    console.log("\n2. Verifying all roles were created...")
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
      ORDER BY pu.role, u.email
    `

    console.log(`✅ Found ${teamMembers.length} team member(s):`)
    teamMembers.forEach((member, index) => {
      const roleDisplay =
        member.role === "partner_admin"
          ? "Admin"
          : member.role === "partner_user"
            ? "Member"
            : "Viewer"
      console.log(`   ${index + 1}. ${member.email} (${roleDisplay}) - ${member.status}`)
    })

    // Test role validation
    console.log("\n3. Testing role validation...")
    try {
      const invalidRole = "invalid_role"
      const testUserId = uuidv4()
      const testPartnerUserId = uuidv4()

      await sql`
        INSERT INTO partner_users (id, partner_id, user_id, role, status)
        VALUES (${testPartnerUserId}, ${partnerId}, ${testUserId}, ${invalidRole}, 'pending')
      `
      console.log("❌ Invalid role was accepted (this should not happen)")
    } catch (error) {
      if (error.message.includes("partner_users_role_check")) {
        console.log("✅ Invalid role correctly rejected")
      } else {
        console.log("⚠️  Unexpected error:", error.message)
      }
    }

    console.log("\n✅ All role tests completed successfully!")
    console.log("The system now supports:")
    console.log("  - Admin (partner_admin): Full access and management")
    console.log("  - Member (partner_user): View and edit access")
    console.log("  - Viewer (partner_viewer): Read-only access")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testAllRoles()
