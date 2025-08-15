'use client';

import { useOktaAuth } from '@/lib/use-okta-auth';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Upload, Eye, EyeOff } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  type: 'game_studio' | 'merch_supplier';
  logo_url?: string;
}

export default function NewGamePage() {
  const { user, isLoading } = useOktaAuth();
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    picture_url: ''
  });

  useEffect(() => {
    if (!isLoading && user && partnerId) {
      fetchPartnerData();
    }
  }, [user, isLoading, partnerId]);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      
      // Get the access token from the API
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      
      const { accessToken } = await tokenResponse.json();
      
      const response = await fetch(`/api/partners/${partnerId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        const partnerData = await response.json();
        setPartner(partnerData);
      } else {
        setError('Partner not found');
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
      setError('Failed to load partner data');
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
    if (name === 'picture_url') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Game name is required');
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

      const response = await fetch(`/api/partners/${partnerId}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newGame = await response.json();
        router.push(`/dashboard/partners/${partnerId}/games/${newGame.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error || 'The requested partner could not be found.'}</p>
          <Link href="/dashboard/partners" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700">
            Back to Partners
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
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {partner.name}
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-orange-900 rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Add New Game</h1>
              <p className="text-gray-400">Create a new game for {partner.name}</p>
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

            {/* Game Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Game Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter game name"
              />
            </div>

            {/* Game Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                Game Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select game type</option>
                <option value="action">Action</option>
                <option value="adventure">Adventure</option>
                <option value="rpg">RPG</option>
                <option value="strategy">Strategy</option>
                <option value="simulation">Simulation</option>
                <option value="sports">Sports</option>
                <option value="racing">Racing</option>
                <option value="puzzle">Puzzle</option>
                <option value="horror">Horror</option>
                <option value="indie">Indie</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Picture URL */}
            <div>
              <label htmlFor="picture_url" className="block text-sm font-medium text-gray-300 mb-2">
                Game Picture URL
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="url"
                  id="picture_url"
                  name="picture_url"
                  value={formData.picture_url}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="https://example.com/game-image.jpg"
                />
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Provide a direct link to the game's image
              </p>
            </div>

            {/* Image Preview */}
            {formData.picture_url && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Image Preview
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
                  <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                    {imageError ? (
                      <div className="flex items-center justify-center h-32 text-gray-400">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                          <p className="text-sm">Failed to load image</p>
                          <p className="text-xs text-gray-500">Please check the URL</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <img
                          src={formData.picture_url}
                          alt="Game preview"
                          className="max-w-full max-h-64 rounded-lg shadow-sm"
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
                href={`/dashboard/partners/${partnerId}`}
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
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Create Game
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 