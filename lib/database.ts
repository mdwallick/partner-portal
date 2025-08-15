import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

// Database types
export interface Partner {
  id: string;
  name: string;
  type: 'game_studio' | 'merch_supplier';
  logo_url?: string;
  organization_id?: string;
  created_at: Date;
  updated_at: Date;
  status: string;
}

export interface User {
  id: string;
  auth0_user_id: string;
  email: string;
  display_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PartnerUser {
  id: string;
  partner_id: string;
  user_id: string;
  role: 'can_admin' | 'can_manage_members' | 'can_view';
  status: 'active' | 'pending' | 'inactive';
  invited_by?: string;
  invited_at: Date;
  joined_at?: Date;
  created_at: Date;
  updated_at: Date;
  email: string;
}

export interface Game {
  id: string;
  partner_id: string;
  name: string;
  type?: string;
  picture_url?: string;
  created_at: Date;
  updated_at: Date;
  status: string;
  client_count?: number;
}

export interface ClientId {
  id: string;
  game_id: string;
  client_name: string;
  client_type: 'native_mobile_android' | 'native_mobile_ios' | 'web' | 'M2M';
  client_id: string;
  created_at: Date;
  status: string;
}

export interface Sku {
  id: string;
  partner_id: string;
  name: string;
  category?: string;
  series?: string;
  product_image_url?: string;
  created_at: Date;
  updated_at: Date;
  status: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: any;
  created_at: Date;
}

// Helper function to generate UUIDs
export const generateId = () => uuidv4();

// Helper function to generate client IDs
export const generateClientId = () => `client_${uuidv4().replace(/-/g, '')}`; 