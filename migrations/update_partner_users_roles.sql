-- Migration: Update partner_users table to use new FGA roles
-- This migration updates the role constraint to use the new FGA role system

-- Drop the existing constraint
ALTER TABLE partner_users DROP CONSTRAINT IF EXISTS partner_users_role_check;

-- Add the new constraint with FGA roles
ALTER TABLE partner_users ADD CONSTRAINT partner_users_role_check 
CHECK (role IN ('can_admin', 'can_manage_members', 'can_view'));

-- Add a comment to document the change
COMMENT ON COLUMN partner_users.role IS 'User role within the partner organization using FGA roles: can_admin, can_manage_members, or can_view'; 