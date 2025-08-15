-- Migration: Create partner_users table
-- This migration creates a table to track user-partner relationships and roles

CREATE TABLE IF NOT EXISTS partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('partner_admin', 'partner_user', 'partner_viewer')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique user-partner combinations
  UNIQUE(partner_id, user_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_partner_users_partner_id ON partner_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_user_id ON partner_users(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_status ON partner_users(status);
CREATE INDEX IF NOT EXISTS idx_partner_users_role ON partner_users(role);

-- Add comments for documentation
COMMENT ON TABLE partner_users IS 'Tracks user-partner relationships and roles';
COMMENT ON COLUMN partner_users.role IS 'User role within the partner organization';
COMMENT ON COLUMN partner_users.status IS 'Invitation/participation status';
COMMENT ON COLUMN partner_users.invited_by IS 'User who sent the invitation';
COMMENT ON COLUMN partner_users.joined_at IS 'When the user accepted the invitation'; 