'use client';

import { useOktaAuth } from '@/lib/use-okta-auth';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Key, Upload, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  type: 'game_studio' | 'merch_supplier';
  logo_url?: string;
}

interface Game {
  id: string;
  name: string;
  type?: string;
  picture_url?: string;
  created_at: string;
  status: string;
}

export default function NewClientIdPage() {
  const { user, isLoading } = useOktaAuth();
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;
  const gameId = params.gameId as string;
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_type: '',
    logo_url: '',
    status: 'active'
  });

  useEffect(() => {
    if (!isLoading && user && partnerId && gameId) {
      fetchGameData();
    }
  }, [user, isLoading, partnerId, gameId]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      
      // Get the access token from the API
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      
      const { accessToken } = await tokenResponse.json();
      
      // Fetch data using the optimized API route
      const response = await fetch(`/api/partners/${partnerId}/games/${gameId}/client-ids/new`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPartner(data.partner);
        setGame(data.game);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError('Failed to load game data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset image error when URL changes and show preview
    if (name === 'logo_url') {
      setImageError(false);
      // Show preview automatically when a URL is provided
      if (value.trim()) {
        setShowPreview(true);
      }
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const copyClientSecret = async () => {
    try {
      await navigator.clipboard.writeText(clientSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (error) {
      console.error('Failed to copy client secret:', error);
    }
  };

  const closeSecretModal = () => {
    setShowSecretModal(false);
    setClientSecret('');
    setCopiedSecret(false);
    router.push(`/dashboard/partners/${partnerId}/games/${gameId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name.trim()) {
      setError('Client ID name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Get the access token
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      
      const { accessToken } = await tokenResponse.json();

      const response = await fetch(`/api/partners/${partnerId}/games/${gameId}/client-ids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newClientId = await response.json();
        setClientSecret(newClientId.clientSecret);
        setShowSecretModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create client ID');
      }
    } catch (error) {
      console.error('Error creating client ID:', error);
      setError('Failed to create client ID');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please sign in to access the partner portal.</p>
        </div>
      </div>
    );
  }

  if (error || !partner || !game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error || 'The requested game could not be found.'}</p>
          <Link href={`/dashboard/partners/${partnerId}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700">
            Back to Partner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/partners/${partnerId}/games/${gameId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {game.name}
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-900 rounded-lg flex items-center justify-center">
                <Key className="h-6 w-6 text-purple-300" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Add Client ID</h1>
              <p className="text-gray-400">Create a new client ID for {game.name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Client ID Name */}
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-300 mb-2">
                Client ID Name *
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400"
                placeholder="Enter client ID name"
              />
            </div>

            {/* Client Type */}
            <div>
              <label htmlFor="client_type" className="block text-sm font-medium text-gray-300 mb-2">
                Client Type *
              </label>
              <select
                id="client_type"
                name="client_type"
                value={formData.client_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white"
              >
                <option value="">Select client type</option>
                <option value="native_mobile_android">Android Native</option>
                <option value="native_mobile_ios">iOS Native</option>
                <option value="web">Web Application</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Logo URL */}
            <div>
              <label htmlFor="logo_url" className="block text-sm font-medium text-gray-300 mb-2">
                Logo URL
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400"
                  placeholder="https://example.com/client-logo.png"
                />
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Provide a direct link to the client's logo
              </p>
            </div>

            {/* Logo Preview */}
            {formData.logo_url && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Logo Preview
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center text-sm text-gray-400 hover:text-white"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Show Preview
                      </>
                    )}
                  </button>
                </div>
                
                {showPreview && (
                  <div className="border border-gray-700 rounded-lg p-4 bg-gray-700">
                    {imageError ? (
                      <div className="flex items-center justify-center h-32 text-gray-400">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                          <p className="text-sm">Failed to load logo</p>
                          <p className="text-xs text-gray-500">Please check the URL</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <img
                          src={formData.logo_url}
                          alt="Client logo preview"
                          className="max-w-full max-h-32 rounded-lg shadow-sm"
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
              <Link
                href={`/dashboard/partners/${partnerId}/games/${gameId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Create Client ID
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Client Secret Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-900 mb-4">
                <Key className="h-6 w-6 text-green-300" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Client ID Created Successfully!</h3>
              <p className="text-sm text-gray-400 mb-6">
                Your Okta OIDC Native application has been created. Please copy and save the client secret below.
              </p>
              
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Client Secret</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={clientSecret}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white font-mono text-sm"
                  />
                  <button
                    onClick={copyClientSecret}
                    className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    {copiedSecret ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-300">
                  ⚠️ <strong>Important:</strong> This client secret will only be shown once. 
                  Make sure to copy and save it securely.
                </p>
              </div>
              
              <button
                onClick={closeSecretModal}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 