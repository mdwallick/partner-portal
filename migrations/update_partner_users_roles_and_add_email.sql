-- Update partner_users table to use new role values and add email column
-- Migration: update_partner_users_roles_and_add_email.sql

-- 1. Add email column to partner_users table
ALTER TABLE partner_users ADD COLUMN email VARCHAR(255);

-- 2. Update existing email values from users table
UPDATE partner_users 
SET email = u.email 
FROM users u 
WHERE partner_users.user_id = u.id;

-- 3. Make email column NOT NULL after populating it
ALTER TABLE partner_users ALTER COLUMN email SET NOT NULL;

-- 4. Drop the old role constraint
ALTER TABLE partner_users DROP CONSTRAINT IF EXISTS partner_users_role_check;

-- 5. Add new role constraint with updated values
ALTER TABLE partner_users ADD CONSTRAINT partner_users_role_check 
CHECK (role IN ('can_admin', 'can_manage_members', 'can_view'));

-- 6. Update existing role values to new format
UPDATE partner_users SET role = 'can_admin' WHERE role = 'partner_admin';
UPDATE partner_users SET role = 'can_manage_members' WHERE role = 'partner_manager';
UPDATE partner_users SET role = 'can_view' WHERE role = 'partner_viewer';

-- 7. Add index on email for better performance
CREATE INDEX IF NOT EXISTS idx_partner_users_email ON partner_users(email); 