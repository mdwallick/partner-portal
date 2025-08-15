const { sql } = require("../lib/database")
const fs = require("fs")
const path = require("path")

async function runMigration() {
  try {
    // Get migration file path from command line arguments
    const migrationFile = process.argv[2]

    if (!migrationFile) {
      console.error("Usage: node scripts/run-migration.js <migration-file>")
      console.error(
        "Example: node scripts/run-migration.js migrations/update_partner_users_roles_and_add_email.sql"
      )
      process.exit(1)
    }

    const migrationPath = path.resolve(migrationFile)

    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`)
      process.exit(1)
    }

    console.log(`Running migration: ${migrationFile}...`)

    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"))

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        await sql.unsafe(statement)
      }
    }

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

runMigration()
