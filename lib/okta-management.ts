// Okta Management API client for organization and user management
export interface OktaOrganization {
  id: string;
  name: string;
  display_name?: string;
  branding?: {
    logo_url?: string;
    colors?: {
      primary?: string;
      page_background?: string;
    };
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OktaUser {
  id: string;
  email: string;
  name?: string;
  status: string;
  created: string;
  lastUpdated: string;
}

class OktaManagementAPI {
  private baseUrl: string;
  private apiToken: string;

  constructor() {
    this.baseUrl = process.env.OKTA_ISSUER!;
    this.apiToken = process.env.OKTA_API_TOKEN!;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `SSWS ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Okta API error response:', errorText);
      throw new Error(`Okta API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle empty responses (like PUT requests that don't return JSON)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      // For non-JSON responses (like empty responses from PUT/DELETE), return null
      return null;
    }
  }

  // Create an Okta Group (equivalent to Auth0 Organization)
  async createGroup(name: string, description?: string, metadata?: Record<string, any>): Promise<OktaOrganization> {
    try {
      const groupData = {
        profile: {
          name: name,
          description: description || `Group for ${name}`
        }
      };

      const response = await this.makeRequest('/api/v1/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });

      return {
        id: response.id,
        name: response.profile.name,
        display_name: response.profile.description,
        metadata: metadata || {},
        created_at: response.created,
        updated_at: response.lastUpdated
      };
    } catch (error) {
      console.error('Error creating Okta group:', error);
      throw new Error(`Failed to create Okta group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all groups
  async getAllGroups(): Promise<OktaOrganization[]> {
    try {
      const response = await this.makeRequest('/api/v1/groups');
      
      return response.map((group: any) => ({
        id: group.id,
        name: group.profile.name,
        display_name: group.profile.description,
        metadata: group.profile,
        created_at: group.created,
        updated_at: group.lastUpdated
      }));
    } catch (error) {
      console.error('Error getting Okta groups:', error);
      throw new Error(`Failed to get Okta groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create an Okta user
  async createUser(email: string, name?: string, groupId?: string): Promise<{ user_id: string; email: string }> {
    try {
      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email address');
      }
      const userData = {
        profile: {
          email: email,
          firstName: name ? name.split(' ')[0] : email.split('@')[0],
          lastName: name ? name.split(' ').slice(1).join(' ') || 'User' : 'User',
          login: email
        }
      };

      console.log('Creating Okta user with data:', JSON.stringify(userData, null, 2));
      const response = await this.makeRequest('/api/v1/users?activate=false', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      // If groupId is provided, add user to the group
      if (groupId) {
        await this.addUserToGroup(response.id, groupId);
      }

      console.log(`✅ Created Okta user: ${response.id} for email: ${email}`);
      return {
        user_id: response.id,
        email: response.profile.email
      };
    } catch (error) {
      console.error('Error creating Okta user:', error);
      throw new Error(`Failed to create Okta user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add user to group
  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    try {
      const result = await this.makeRequest(`/api/v1/groups/${groupId}/users/${userId}`, {
        method: 'PUT'
      });
      console.log(`✅ Added user ${userId} to group ${groupId}`);
    } catch (error) {
      console.error('Error adding user to group:', error);
      throw new Error(`Failed to add user to group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Remove user from group
  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    try {
      const result = await this.makeRequest(`/api/v1/groups/${groupId}/users/${userId}`, {
        method: 'DELETE'
      });
      console.log(`✅ Removed user ${userId} from group ${groupId}`);
    } catch (error) {
      console.error('Error removing user from group:', error);
      throw new Error(`Failed to remove user from group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get users in a group
  async getGroupUsers(groupId: string): Promise<OktaUser[]> {
    try {
      const response = await this.makeRequest(`/api/v1/groups/${groupId}/users`);
      
      return response.map((user: any) => ({
        id: user.id,
        email: user.profile.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`.trim(),
        status: user.status,
        created: user.created,
        lastUpdated: user.lastUpdated
      }));
    } catch (error) {
      console.error('Error getting group users:', error);
      throw new Error(`Failed to get group users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Deactivate a user
  async deactivateUser(userId: string): Promise<void> {
    try {
      const result = await this.makeRequest(`/api/v1/users/${userId}/lifecycle/deactivate`, {
        method: 'POST'
      });
      console.log(`✅ Deactivated user ${userId}`);
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw new Error(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Permanently delete a user
  async deleteUser(userId: string): Promise<void> {
    try {
      // First deactivate the user if not already deactivated
      try {
        await this.makeRequest(`/api/v1/users/${userId}/lifecycle/deactivate`, {
          method: 'POST'
        });
        console.log(`✅ Deactivated user ${userId} before deletion`);
      } catch (error) {
        // User might already be deactivated, continue with deletion
        console.log(`User ${userId} might already be deactivated, continuing with deletion`);
      }

      // Then permanently delete the user
      const result = await this.makeRequest(`/api/v1/users/${userId}`, {
        method: 'DELETE'
      });
      console.log(`✅ Permanently deleted user ${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Activate a user
  async activateUser(userId: string): Promise<void> {
    try {
      const result = await this.makeRequest(`/api/v1/users/${userId}/lifecycle/activate`, {
        method: 'POST'
      });
      console.log(`✅ Activated user ${userId}`);
    } catch (error) {
      console.error('Error activating user:', error);
      throw new Error(`Failed to activate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update a user
  async updateUser(userId: string, updates: { name?: string; email?: string }): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.name) {
        const nameParts = updates.name.split(' ');
        updateData.profile = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || ''
        };
      }
      
      if (updates.email) {
        updateData.profile = {
          ...updateData.profile,
          email: updates.email,
          login: updates.email
        };
      }

      await this.makeRequest(`/api/v1/users/${userId}`, {
        method: 'POST',
        body: JSON.stringify(updateData)
      });
      console.log(`✅ Updated user ${userId}`);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete an organization (group)
  async deleteOrganization(groupId: string): Promise<void> {
    try {
      await this.makeRequest(`/api/v1/groups/${groupId}`, {
        method: 'DELETE'
      });
      console.log(`✅ Deleted Okta group: ${groupId}`);
    } catch (error) {
      console.error('Error deleting Okta group:', error);
      throw new Error(`Failed to delete Okta group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update a group
  async updateGroup(groupId: string, name: string, description?: string): Promise<void> {
    try {
      const updateData = {
        profile: {
          name: name,
          description: description || `Group for ${name}`
        }
      };

      await this.makeRequest(`/api/v1/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      console.log(`🚀 Updated Okta group: ${groupId} to "${name}"`);
    } catch (error) {
      console.error('Error updating Okta group:', error);
      throw new Error(`Failed to update Okta group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create an OIDC Native Application
  async createOIDCNativeApp(name: string, redirectUris?: string[]): Promise<{ clientId: string; clientSecret: string }> {
    try {
      const appData = {
        name: 'oidc_client',
        label: name,
        signOnMode: 'OPENID_CONNECT',
        credentials: {
          oauthClient: {
            autoKeyRotation: true,
            token_endpoint_auth_method: 'none'
          }
        },
        settings: {
          oauthClient: {
            application_type: 'native',
            grant_types: [
              'authorization_code',
              'refresh_token'
            ],
            response_types: [
              'code'
            ],
            redirect_uris: redirectUris || [
              'com.example.app:/callback'
            ],
            post_logout_redirect_uris: [
              'com.example.app:/logout'
            ]
          }
        }
      };

      //console.log('Creating Okta app with data:', JSON.stringify(appData, null, 2));

      const response = await this.makeRequest('/api/v1/apps', {
        method: 'POST',
        body: JSON.stringify(appData)
      });

      //console.log('Okta app created:', response);

      // The client secret should be available in the initial response
      const clientSecret = response.credentials.oauthClient.client_secret;
      
      console.log('Client credentials from response:', {
        clientId: response.credentials.oauthClient.client_id,
        clientSecret: clientSecret
      });
      
      return {
        clientId: response.credentials.oauthClient.client_id,
        clientSecret: clientSecret
      };
    } catch (error) {
      console.error('Error creating Okta OIDC native app:', error);
      throw new Error(`Failed to create Okta OIDC native app: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create an OIDC Web Application
  async createOIDCWebApp(name: string, redirectUris?: string[]): Promise<{ clientId: string; clientSecret: string }> {
    try {
      const appData = {
        name: 'oidc_client',
        label: name,
        signOnMode: 'OPENID_CONNECT',
        credentials: {
          oauthClient: {
            autoKeyRotation: true,
            token_endpoint_auth_method: 'client_secret_basic'
          }
        },
        settings: {
          oauthClient: {
            application_type: 'web',
            grant_types: [
              'authorization_code',
              'refresh_token'
            ],
            response_types: [
              'code'
            ],
            redirect_uris: redirectUris || [
              'http://localhost:3000/callback'
            ],
            post_logout_redirect_uris: [
              'http://localhost:3000/logout'
            ]
          }
        }
      };

      //console.log('Creating Okta Web app with data:', JSON.stringify(appData, null, 2));

      const response = await this.makeRequest('/api/v1/apps', {
        method: 'POST',
        body: JSON.stringify(appData)
      });

      //console.log('Okta Web app created:', response);

      // The client secret should be available in the initial response
      const clientSecret = response.credentials.oauthClient.client_secret;
      
      console.log('Client credentials from response:', {
        clientId: response.credentials.oauthClient.client_id,
        clientSecret: clientSecret
      });
      
      return {
        clientId: response.credentials.oauthClient.client_id,
        clientSecret: clientSecret
      };
    } catch (error) {
      console.error('Error creating Okta OIDC Web app:', error);
      throw new Error(`Failed to create Okta OIDC Web app: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const oktaManagementAPI = new OktaManagementAPI(); 