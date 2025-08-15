'use client';

import { useOktaAuth } from '@/lib/use-okta-auth';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Gamepad2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Game {
  id: string;
  name: string;
  type?: string;
  picture_url?: string;
  created_at: string;
  client_ids_count: number;
}

interface Partner {
  id: string;
  name: string;
  type: 'game_studio' | 'merch_supplier';
}

export default function EditGamePage() {
  const { user, isLoading } = useOktaAuth();
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;
  const gameId = params.gameId as string;
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    picture_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [canView, setCanView] = useState(false);
  const [canAdmin, setCanAdmin] = useState(false);

  useEffect(() => {
    if (!isLoading && user && partnerId && gameId) {
      fetchData();
    }
  }, [user, isLoading, partnerId, gameId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get the access token from the API
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      
      const { accessToken } = await tokenResponse.json();
      
      // Fetch game details (includes partner info)
      const gameResponse = await fetch(`/api/partners/${partnerId}/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
        setGame(gameData);
        setFormData({
          name: gameData.name,
          type: gameData.type || '',
          picture_url: gameData.picture_url || ''
        });
        
        // Set partner info from game response
        setPartner({
          id: gameData.partner_id,
          name: gameData.partner_name,
          type: gameData.partner_type
        });
        
        // Set permissions based on game data response
        setCanView(true); // If we got the game data, user can view
        setCanAdmin(gameData.userCanAdmin || false); // Set admin permission from response
      } else {
        setError('Game not found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Get the access token
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      
      const { accessToken } = await tokenResponse.json();
      
      const response = await fetch(`/api/partners/${partnerId}/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Game updated successfully!');
        router.push(`/dashboard/partners/${partnerId}/games/${gameId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update game');
      }
    } catch (error) {
      setError('An error occurred while updating the game');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The requested game could not be found.'}</p>
          <Link href={`/dashboard/partners/${partnerId}/games`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  // If user can't view, show access denied
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don't have permission to view this game.</p>
          <Link href={`/dashboard/partners/${partnerId}/games`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
            Back to Games
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
            Back to Game
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit Game</h1>
          <p className="text-gray-400 mt-2">Update game information</p>
        </div>

        {/* Game Info */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {game.picture_url ? (
                <img 
                  src={game.picture_url} 
                  alt={`${game.name} image`}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                  🎮
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{game.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg">🎮</span>
                <span className="text-gray-400">{game.type || 'Game'}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(game.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                {game.client_ids_count} client ID{game.client_ids_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          {!canAdmin && (
            <div className="bg-yellow-900 border border-yellow-700 rounded-md p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                You have view-only access to this game. Contact an administrator to make changes.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-4">
                <p className="text-red-200 text-sm">{error}</p>
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
                disabled={!canAdmin}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter game name"
              />
            </div>

            {/* Game Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                Game Type
              </label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                disabled={!canAdmin}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Action, RPG, Strategy"
              />
              <p className="mt-1 text-sm text-gray-400">
                Optional: Type or genre of the game
              </p>
            </div>

            {/* Picture URL */}
            <div>
              <label htmlFor="picture_url" className="block text-sm font-medium text-gray-300 mb-2">
                Picture URL
              </label>
              <input
                type="url"
                id="picture_url"
                name="picture_url"
                value={formData.picture_url}
                onChange={handleInputChange}
                disabled={!canAdmin}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://example.com/game-image.jpg"
              />
              <p className="mt-1 text-sm text-gray-400">
                Optional: URL to the game's image
              </p>
            </div>

            {/* Preview */}
            {formData.name && (
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 relative">
                    {formData.picture_url ? (
                      <img 
                        src={formData.picture_url} 
                        alt="Game preview"
                        className="h-16 w-16 rounded-lg object-cover"
                        onError={(e) => {
                          // Hide the broken image and show fallback
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold ${formData.picture_url ? 'hidden' : ''}`}>
                      🎮
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{formData.name}</h4>
                    <p className="text-sm text-gray-400">{formData.type || 'Game'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions - Only show if user can admin */}
            {canAdmin && (
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600">
                <Link
                  href={`/dashboard/partners/${partnerId}/games/${gameId}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || !formData.name}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 