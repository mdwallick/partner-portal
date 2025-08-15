# Partner Portal – Product Requirements Document (PRD)

## Overview

**Product Name:** Partner Portal for Music Artists\
**Purpose:**\
Enable secure access for external partners (artists and producers) to manage their songs and albums. Auth0 will be used as the identity provider and Auth0 FGA to model and manage relationships. Artists will be represented as Auth0 organizations. The application framework will use NextJS, postgresql for the database, and Prisma for database operations.

---

## 1. Roles (Auth0 + FGA)

| Role              | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `partner_admin`   | Admin within an artist's org                                        |
| `partner_user`    | Member within an artist's org                                       |
| `sme_admin`       | Internal admin assigned to manage specific partners                 |
| `sme_super_admin` | Internal admin who can view/edit everything and manage `sme_admins` |

---

## 2. Entities & Relationships (Auth0 FGA)

**Entities:**

- `partner:{partner_id}` (has attribute `type`: `artist` or `producer`)
- `user:{user_id}`
- `album:{album_id}`
- `song:{song_id}`

**Relationships:**

- `partner` → owns many `albums` and `songs` (only if `type = artist`)
- `partner` → manages many `albums` and `songs` (only if `type = producer`)
- `partner` → includes many `users`
- `partner` → managed by `sme_admin`

---

## 3. UI Views

### 3.0 Login Page

- Login page hosted by Auth0
- Supports SSO & social login

### 3.1 Partner Management (SME Admins and SME Super Admin)

- List all partners (`/dashboard/partners`)
  - Show name, type, logo (or default), creation date
  - Filter by partner type
- Create a new partner (`/dashboard/partners/new`):
  - Name (required)
  - Type (`artist` or `producer`)
  - Returns `partner_id`
- Edit existing partner (`/dashboard/partners/:partner_id/edit`):
  - Update name
  - Add or update logo URL
- Assign/unassign `sme_admin` to a partner (`/dashboard/partners/:partner_id/admins`) (only for `sme_super_admin`)

### 3.2 Dashboard

- Partner Name, Type (`artist` or `producer`) (`/dashboard`)
- Stats: Songs and albums (`/dashboard/stats`)
- Quick links: Add Song / Add Album, View Profile (`/dashboard/albums/new`, `/dashboard/songs/new`, `/dashboard/profile`)

### 3.3 Album Management (Artists only)

- List albums (`/dashboard/albums`):
  - Album picture (if any; default image if none)
  - Name
  - Genre
  - Date of creation
- **Create** an album (`/dashboard/albums/new`):
  - Provide name (required)
  - Returns `album_id`
- **Edit** album metadata (`/dashboard/albums/:album_id/edit`):
  - Update name
  - Optionally add/update album picture URL
  - Optionally select genre
- **Revoke** a game (`/dashboard/games/:game_id/revoke`)

### 3.4 User Management (Partner Admins)

- List partner users (`/dashboard/users`) (email, role)
- Invite user to organization (`/dashboard/users/invite`)
- Remove user from organization (`/dashboard/users/:user_id/remove`)

### 3.5 SME Admin View

- View only assigned partners (`/dashboard/admin/partners`)
- Create new partner by entering (`/dashboard/admin/partners/new`):
  - Partner name (required)
  - Type: `artist` or `producer` (required)
  - Returns `partner_id` on creation
- Edit existing partner (`/dashboard/admin/partners/:partner_id/edit`):
  - Modify name
  - Optionally add or update logo URL
- List all assigned partners (`/dashboard/admin/partners`):
  - Show partner logo (default image if missing)
  - Name, type, creation date
  - Click-through to partner-specific management views

### 3.6 SME Super Admin View

- Full access to all partners (`/dashboard/super-admin`), albums, songs, and users
- View and edit all data formerly accessible by platform staff (`/dashboard/super-admin/audit`) (audit logs, global listings)
- Add or remove `sme_admin` roles for users (`/dashboard/super-admin/manage-admins`)
- Manage partner assignments for `sme_admin` (`/dashboard/super-admin/assignments`)
- View system-wide audit logs and stats (`/dashboard/super-admin/stats`)

---

## 4. API Endpoints

### 4.1 Auth (via Auth0)

- `GET /login` → Auth0 Hosted Login
  - Redirect user to Auth0's hosted login page
  - Handle OAuth2/OIDC provider integrations
  - Await redirect back to configured callback URL

- `GET /callback` → Token handling
  - Parse Auth0 authorization response
  - Exchange code for access and ID token
  - Store session token or cookie

### 4.2 Partner

- `GET /api/partners/me`
  - Validate JWT access token via Auth0
  - Extract partner from token context
  - Look up partner metadata in DB
  - Return partner name, type, and user role

- `POST /api/partners/users` → Invite partner user
  - Validate JWT access token via Auth0
  - Validate inviter permissions via FGA (`partner_admin`)
  - Validate email and role input
  - Create Auth0 invitation or trigger invitation email
  - Create tuple in FGA linking user to partner

- `DELETE /api/partners/users/:user_id` → Remove partner user
  - Validate JWT access token via Auth0
  - Validate requester permissions via FGA
  - Delete user-partner tuple in FGA
  - (Optional) Deactivate user from Auth0 tenant

- `POST /api/partners` → Create partner (requires name & type, returns `partner_id`)
  - Validate JWT access token via Auth0
  - Validate role via FGA (`sme_admin` or `sme_super_admin`)
  - Validate payload: name and type
  - Insert partner in database
  - Generate and return new `partner_id`

- `PUT /api/partners/:partner_id` → Update name and/or logo URL
  - Validate JWT access token via Auth0
  - Validate edit rights via FGA
  - Update database fields accordingly

- `GET /api/partners` → List partners (includes name, type, logo URL if any, created_at)
  - Validate JWT access token via Auth0
  - Filter by `sme_admin` assignment or `sme_super_admin` via FGA
  - Filter by `sme_admin` assignment or `sme_super_admin`
  - Load and return metadata

- `POST /api/partners/users` → Invite partner user

- `DELETE /api/partners/users/:user_id` → Remove partner user

- `POST /api/partners` → Create partner (requires name & type, returns `partner_id`)

- `PUT /api/partners/:partner_id` → Update name and/or logo URL

- `GET /api/partners` → List partners (includes name, type, logo URL if any, created_at)

### 4.3 Album

- `GET /api/albums`
  - Validate JWT access token via Auth0
  - Query DB for albums linked to that partner
  - Return album list with metadata

- `POST /api/albums` → Registers an album
  - Validate JWT access token via Auth0
  - Validate partner permissions via FGA
  - Validate name input
  - Create album in DB
  - Link album to partner in FGA
  - Return `album_id`

- `PUT /api/albums/:album_id`
  - Validate JWT access token via Auth0
  - Validate edit permission via FGA
  - Allow updates to album name, genre, and optional picture URL
  - Update DB fields accordingly

- `DELETE /api/albums/:album_id`
  - Validate JWT access token via Auth0
  - Validate revoke permission via FGA
  - Mark album as inactive or deleted

### 4.4 Song

- `GET /api/songs`
  - Validate JWT access token via Auth0
  - Validate that user is an artist partner
  - Return song list with metadata

- `POST /api/songs`
  - Validate JWT access token via Auth0
  - Validate artist permissions via FGA
  - Validate input name, validate input duration
  - Insert new song in database
  - Return `song_id`

- `PUT /api/songs/:song_id`
  - Validate JWT access token via Auth0
  - Validate song ownership via FGA
  - Update metadata fields in DB

- `DELETE /api/songs/:song_id`
  - Validate JWT access token via Auth0
  - Validate song permission via FGA
  - Soft delete song (mark as archived)

### 4.5 FGA Tuples (Relationships)

```yaml
writes:
  tuple_keys:
    - user: user:alice
      relation: partner_admin
      object: partner:studio456
    - user: user:bob
      relation: partner_user
      object: partner:studio456
    - user: user:carol
      relation: cr_admin
      object: partner:studio456
    - user: user:user789
      relation: partner_user
      object: partner:studio456
    - user: user:cradmin456
      relation: manager
      object: partner:studio456
    - user: partner:studio456
      relation: owner
      object: game:tokyo-smash
    - user: partner:supplier789
      relation: supplier
      object: sku:plush-goku
    - user: game:tokyo-smash
      relation: parent
      object: client:tokyo-smash-ios
    - user: user:admin001
      relation: super_admin
      object: platform
    - user: user:crsuperadmin001
      relation: super_admin
      object: platform
```

---

## 5. Auth0 FGA Authorization Model (DSL)

```dsl
model
  schema 1.1

type user

type partner
  relations
    define partner_admin: [user]
    define partner_user: [user]
    define sme_admin: [user]
    define sme_super_admin: [user]
    define can_view: partner_admin or partner_user or sme_admin or sme_super_admin
    define can_manage: partner_admin or sme_admin or sme_super_admin

type album
  relations
    define owner: [partner]
    define can_view: [user]
    define can_manage: [user]

type song
  relations
    define owner: [partner]
    define can_view: [user]
    define can_manage: [user]

type platform
  relations
    define super_admin: [user]
    define can_view_all: super_admin
    define can_manage_all: super_admin
    define manage_cr_admins: super_admin
```

This model defines:

- Users tied to partners as `admin`, `member`, `manager`, or `sme_admin`
- Partners own `albums` and `songs`, enabling permission propagation
- A `platform` object for `sme_super_admin` to get universal access and manage `sme_admin` assignments
