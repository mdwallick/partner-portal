const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running migration: Update partner_users table with new roles and email column...');
    
    // 1. Add email column to partner_users table
    console.log('1. Adding email column...');
    await sql`ALTER TABLE partner_users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
    
    // 2. Update existing email values from users table
    console.log('2. Populating email values...');
    await sql`
      UPDATE partner_users 
      SET email = u.email 
      FROM users u 
      WHERE partner_users.user_id = u.id
    `;
    
    // 3. Make email column NOT NULL after populating it
    console.log('3. Making email column NOT NULL...');
    await sql`ALTER TABLE partner_users ALTER COLUMN email SET NOT NULL`;
    
    // 4. Update existing role values to new format BEFORE adding constraint
    console.log('4. Updating existing role values...');
    await sql`UPDATE partner_users SET role = 'can_admin' WHERE role = 'partner_admin'`;
    await sql`UPDATE partner_users SET role = 'can_manage_members' WHERE role = 'partner_manager'`;
    await sql`UPDATE partner_users SET role = 'can_view' WHERE role = 'partner_viewer'`;
    
    // 5. Drop the old role constraint
    console.log('5. Dropping old role constraint...');
    await sql`ALTER TABLE partner_users DROP CONSTRAINT IF EXISTS partner_users_role_check`;
    
    // 6. Add new role constraint with updated values
    console.log('6. Adding new role constraint...');
    await sql`
      ALTER TABLE partner_users ADD CONSTRAINT partner_users_role_check 
      CHECK (role IN ('can_admin', 'can_manage_members', 'can_view'))
    `;
    
    // 7. Add index on email for better performance
    console.log('7. Adding email index...');
    await sql`CREATE INDEX IF NOT EXISTS idx_partner_users_email ON partner_users(email)`;
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 