-- Migration: Add organization_id column to partners table
-- This migration adds an organization_id column to store the Auth0 organization ID

ALTER TABLE partners 
ADD COLUMN organization_id VARCHAR(255);

-- Add an index on organization_id for better query performance
CREATE INDEX idx_partners_organization_id ON partners(organization_id);

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN partners.organization_id IS 'Auth0 organization ID associated with this partner'; 