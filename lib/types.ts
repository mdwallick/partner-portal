export type PartnerUser = {
  id: string
  partner_id: string
  role: string
  status: string
  invited_at: Date | null
  joined_at: Date | null
  created_at: Date
  email: string
  display_name?: string
  auth0_user_id?: string
}

export interface Partner {
  id: string
  name: string
  type: "artist" | "merch_supplier"
  logo_url?: string
  organization_id?: string
  created_at: string
  userCanView?: boolean
  userCanAdmin?: boolean
  userCanManageMembers?: boolean
}

export interface Song {
  id: string
  name: string
  genre: string
  picture_url?: string
  stream_count: number
  created_at: string
}

export interface SKU {
  id: string
  name: string
  category?: string
  image_url?: string
  status: "active" | "inactive"
  created_at: string
}

export interface User {
  id: string
  email: string
  display_name?: string
  role: string
  created_at: string
  auth0_user_id?: string
}
