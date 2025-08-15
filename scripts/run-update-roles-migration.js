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

async function runUpdateRolesMigration() {
  try {
    console.log("Running migration: Update partner_users table to include viewer role...")

    // Read and execute the migration SQL
    const migrationPath = "./migrations/update_partner_users_roles.sql"

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration - split by semicolons and execute each statement
    const statements = migrationSQL.split(";").filter(stmt => stmt.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        await sql(statement.trim())
      }
    }

    console.log("✅ partner_users role update migration completed successfully!")

    // Verify the constraint was updated
    const constraints = await sql`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'partner_users_role_check'
    `

    if (constraints.length > 0) {
      console.log("✅ Role constraint updated successfully")
      console.log(`   Constraint: ${constraints[0].check_clause}`)
    } else {
      console.log("⚠️  Could not verify constraint update")
    }

    // Test inserting a viewer role
    console.log("\n🧪 Testing viewer role insertion...")
    try {
      // This is just a test - we'll rollback
      await sql`BEGIN`

      // Try to insert a test viewer role (this should work now)
      const testResult = await sql`
        INSERT INTO partner_users (id, partner_id, user_id, role, status)
        VALUES (gen_random_uuid(), 'd87b44a4-f024-4dae-9ebd-be4c89857f7e', 
                (SELECT id FROM users LIMIT 1), 'partner_viewer', 'pending')
        RETURNING role
      `

      console.log(`✅ Successfully inserted viewer role: ${testResult[0].role}`)

      // Rollback the test
      await sql`ROLLBACK`
      console.log("✅ Test rolled back successfully")
    } catch (testError) {
      await sql`ROLLBACK`
      console.error("❌ Viewer role test failed:", testError.message)
    }
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

runUpdateRolesMigration()
