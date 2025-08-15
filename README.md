# Partner Portal - Streaming Platform

A comprehensive partner portal for managing game studios and merch suppliers, built with Next.js, Okta for AuthN, Auth0 FGA for AuthZ, and Neon DB.

## ⚠️ Disclaimer

This project is **not production-ready** and is provided for **demonstration, educational and experimental purposes only**.  
It comes with **no warranty of any kind**, either express or implied. Use it **at your own risk**.

The authors and contributors are **not liable for any damages or losses** arising from the use of this code.  
You are solely responsible for evaluating its fitness for your intended use, and for ensuring it meets all relevant legal, security, and quality standards before deploying it in any production environment.

## 🚀 Features

### Authentication & Authorization

- **Okta Integration**: Secure authentication with SSO and social login support
- **Auth0 FGA**: Fine-grained authorization with relationship-based access control
- **Role-based Access**: Different permissions for partner admins, users, and CR admins

### Partner Management

- **Game Studios**: Create and manage games, client IDs, and metadata
- **Merch Suppliers**: Manage product catalog with SKUs and categories
- **User Management**: Invite and manage team members within partner organizations

### Dashboard & Analytics

- **Partner Dashboard**: Overview with stats and quick actions
- **Game Management**: Full CRUD operations for games and client IDs
- **Product Management**: Complete SKU lifecycle management
- **Audit Logging**: Track all system activities

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Authentication**: Okta
- **Authorization**: Auth0 FGA (Fine-Grained Authorization)
- **Database**: Neon (PostgreSQL)
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Okta account
- Auth0 FGA account
- Neon database account

## 🚀 Quick Start

### 1. Locally Clone and Install

```bash
git clone https://github.com/nicotriballier/partner-portal-okta-idp-with-auth0-fga.git
cd partner-portal-okta-idp-with-auth0-fga
npm install
```

### 2. Environment Setup

For this demo env, get the .env.local file from the [shared Google Folder](https://drive.google.com/file/d/1UC0wUkAtQUWezninw6lEKxAclxQZ1mIW/view?usp=drive_link)

**Then SKIP TO STEP 5** ❗

Copy the environment example and configure your variables

```bash
cp env.example .env.local
```

Update `.env.local` with your credentials:

```env
# Okta Configuration
OKTA_ISSUER='https://YOUR_OKTA_DOMAIN'
OKTA_CLIENT_ID='YOUR_OKTA_CLIENT_ID'
OKTA_CLIENT_SECRET='YOUR_OKTA_CLIENT_SECRET'
OKTA_REDIRECT_URI='http://localhost:3000/login/callback'

# Okta Management API Configuration
OKTA_API_TOKEN='YOUR_OKTA_API_TOKEN'

# Auth0 FGA Configuration
FGA_API_URL='https://api.fga.example'
FGA_STORE_ID='YOUR_FGA_STORE_ID'
FGA_AUTHORIZATION_MODEL_ID='YOUR_FGA_AUTHORIZATION_MODEL_ID'
FGA_API_TOKEN_ISSUER='https://YOUR_OKTA_DOMAIN/'
FGA_API_AUDIENCE='https://api.openfga.example/'
FGA_CLIENT_ID='YOUR_FGA_CLIENT_ID'
FGA_CLIENT_SECRET='YOUR_FGA_CLIENT_SECRET'

# Neon Database Configuration
DATABASE_URL='postgresql://username:password@host:port/database'

# API Configuration
NEXT_PUBLIC_API_BASE_URL='http://localhost:3000/api'

# Application Configuration
NEXT_PUBLIC_APP_NAME='Partner Portal'
NEXT_PUBLIC_APP_DESCRIPTION='Streaming Platform Partner Portal'

```

### 3. Database Setup

The application uses Neon PostgreSQL with the following schema:

#### Tables

- `partners` - Partner organizations (game studios & merch suppliers)
- `users` - User metadata linked to Auth0
- `games` - Games owned by game studio partners
- `client_ids` - Client IDs associated with games
- `skus` - SKUs managed by merch supplier partners
- `audit_logs` - System audit trail

#### Key Features

- UUID primary keys for security
- Foreign key relationships with CASCADE deletes
- Automatic timestamps (created_at, updated_at)
- Performance indexes on frequently queried columns
- ENUM types for data validation

```bash
brew install postgresql
```

### 4. Okta Configuration

1. Create an Okta application
2. Configure callback URLs: `http://localhost:3000/login/callback`
3. Set up your Auth0 FGA store
4. Configure the authorization model (see `fga-model.dsl`)

#### Okta Groups Setup (equivalent to Auth0 Organizations)

1. **Create Groups**: In your Okta dashboard, go to "Directory" → "Groups"
2. **Create Management API Token**:
   - Go to "Security" → "API" → "Tokens"
   - Create a new API token with the following scopes:
     - `okta.groups.manage`
     - `okta.users.manage`
     - `okta.users.read`
3. **Configure Environment Variables**:
   - Add `OKTA_API_TOKEN` to your `.env.local`
   - This is the API token you created for management operations

### 5. Auth0 FGA Configuration

1. Create an Okta Machine-to-Machine application for FGA
2. Deploy your authorization model to FGA (see `fga-model.dsl`)
3. Configure the following environment variables:
   - `FGA_STORE_ID`: Your FGA store ID
   - `FGA_AUTHORIZATION_MODEL_ID`: Your deployed authorization model ID
   - `FGA_API_TOKEN_ISSUER`: Your Okta domain (e.g., `https://your-tenant.okta.com/`)
   - `FGA_API_AUDIENCE`: The FGA API audience (e.g., `https://api.openfga.example/`)
   - `FGA_CLIENT_ID`: Your M2M application client ID
   - `FGA_CLIENT_SECRET`: Your M2M application client secret
4. Grant the necessary scopes to your M2M application

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Auth0 authentication
│   │   ├── games/         # Game management API
│   │   ├── partners/      # Partner management API
│   │   └── sku/           # SKU management API
│   ├── dashboard/         # Dashboard pages
│   │   ├── games/         # Game management UI
│   │   ├── products/      # Product management UI
│   │   └── users/         # User management UI
│   ├── login/             # Login page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                   # Utility libraries
│   ├── auth0.ts           # Auth0 configuration
│   ├── database.ts        # Database connection & types
│   └── fga.ts             # FGA client & helpers
├── components/            # Reusable components
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## 🔐 Authorization Model

The application uses Auth0 FGA with the following model:

```dsl
model
  schema 1.1

type user

type partner
  relations
    define can_admin: [user] or super_admin from parent
    define can_manage_members: [user] or can_admin or can_manage_all from parent
    define can_view: [user] or can_manage_members or can_view_all from parent
    define parent: [platform]

type game
  relations
    define can_admin: [user] or can_admin from parent
    define can_view: [user] or can_view from parent
    define parent: [partner]

type sku
  relations
    define can_admin: [user] or can_admin from parent
    define can_view: [user] or can_view from parent
    define parent: [partner]

type client
  relations
    define can_admin: [user] or can_admin from parent
    define can_view: [user] or can_view from parent
    define parent: [game]

type platform
  relations
    define can_manage_all: [user] or super_admin
    define can_view_all: [user] or can_manage_all
    define manage_cr_admins: [user] or super_admin
    define super_admin: [user]
```

## 🎯 User Roles

### Partner Roles

- **partner_admin**: Admin within a partner organization
- **partner_user**: Member within a partner organization

### CR Roles

- **cr_admin**: Internal admin assigned to manage specific partners
- **cr_super_admin**: Internal admin with full system access

## 📊 API Endpoints

### Authentication

- `GET /api/auth/login` - Okta login
- `GET /api/auth/callback` - Okta callback
- `GET /api/auth/logout` - Okta logout

### Partners

- `GET /api/partners/me` - Get current partner info
- `GET /api/partners` - List partners (CR admins only)
- `POST /api/partners` - Create partner (CR admins only)
- `PUT /api/partners/:id` - Update partner
- `POST /api/partners/users` - Invite user
- `DELETE /api/partners/users/:id` - Remove user

### Games

- `GET /api/games` - List games for partner
- `POST /api/games` - Create game
- `PUT /api/games/:id` - Update game
- `DELETE /api/games/:id` - Revoke game
- `POST /api/games/:id/client-ids` - Add client ID

### SKUs

- `GET /api/sku` - List SKUs for partner
- `POST /api/sku` - Create SKU
- `PUT /api/sku/:id` - Update SKU
- `DELETE /api/sku/:id` - Archive SKU

## 🎨 UI Components

The application uses a modern, responsive design with:

- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Responsive design** for mobile and desktop

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for version control

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation
- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ for our awesome Okta/Auth0 community.
