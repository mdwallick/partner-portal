'use client';

import { useOktaAuth } from '@/lib/use-okta-auth';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Gamepad2, Users, Settings, Eye } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  type?: string;
  picture_url?: string;
  created_at: string;
  client_ids_count: number;
  description?: string;
  status?: 'active' | 'inactive' | 'draft';
  userCanAdmin?: boolean;
}

interface ClientId {
  id: string;
  client_name: string;
  client_id: string;
  client_type?: string;
  created_at: string;
  status: 'active' | 'inactive';
}

export default function GameDetailPage() {
  const { user, isLoading } = useOktaAuth();
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;
  const gameId = params.gameId as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [clientIds, setClientIds] = useState<ClientId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      
      // Fetch game details with Authorization header
      const gameResponse = await fetch(`/api/partners/${partnerId}/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
        setGame(gameData);
        
        // Fetch client IDs
        await fetchClientIdsData(accessToken);
      } else {
        setError('Game not found');
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError('Failed to load game data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientIdsData = async (accessToken?: string) => {
    try {
      // Get access token if not provided
      let token = accessToken;
      if (!token) {
        const tokenResponse = await fetch('/api/auth/token');
        if (!tokenResponse.ok) {
          throw new Error('Failed to get access token');
        }
        const { accessToken: tokenData } = await tokenResponse.json();
        token = tokenData;
      }
      
      const clientIdsResponse = await fetch(`/api/partners/${partnerId}/games/${gameId}/client-ids`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (clientIdsResponse.ok) {
        const clientIdsData = await clientIdsResponse.json();
        setClientIds(clientIdsData);
      }
    } catch (error) {
      console.error('Error fetching client IDs:', error);
    }
  };

  const handleDeleteGame = async () => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return;
    }

    try {
      // Get the access token
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      
      const { accessToken } = await tokenResponse.json();
      
      const response = await fetch(`/api/partners/${partnerId}/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        router.push(`/dashboard/partners/${partnerId}`);
      } else {
        setError('Failed to delete game');
      }
    } catch (error) {
      console.error('Error deleting game:', error);
      setError('Failed to delete game');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-300';
      case 'inactive':
        return 'bg-red-900 text-red-300';
      case 'draft':
        return 'bg-yellow-900 text-yellow-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const getClientTypeLabel = (type: string) => {
    switch (type) {
      case 'web':
        return 'Web';
      case 'native_mobile_android':
        return 'Android';
      case 'native_mobile_ios':
        return 'iOS';
      case 'native_desktop':
        return 'Desktop';
      case 'server':
        return 'Server';
      case 'sdk':
        return 'SDK';
      default:
        return type || 'Unknown';
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

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The requested game could not be found.'}</p>
          <Link href={`/dashboard/partners/${partnerId}`} className="text-orange-500 hover:text-orange-400">
            Back to Partner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partner
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 relative">
                {game.picture_url ? (
                  <img 
                    src={game.picture_url} 
                    alt={`${game.name} logo`}
                    className="h-20 w-20 rounded-lg object-cover"
                    onError={(e) => {
                      // Hide the broken image and show fallback
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`h-20 w-20 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold ${game.picture_url ? 'hidden' : ''}`}>
                  {game.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{game.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">🎮</span>
                  <span className="text-lg text-gray-400">Game</span>
                  {game.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                      {game.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Created {new Date(game.created_at).toLocaleDateString()}
                </p>
                {game.description && (
                  <p className="text-sm text-gray-400 mt-1 max-w-2xl">
                    {game.description}
                  </p>
                )}
              </div>
            </div>
            
            {game.userCanAdmin && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/dashboard/partners/${partnerId}/games/${gameId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Game
                </Link>
                <button
                  onClick={handleDeleteGame}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Game
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 text-lg">🔑</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Client IDs</p>
                <p className="text-2xl font-bold text-white">{clientIds.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active</p>
                <p className="text-2xl font-bold text-white">
                  {clientIds.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          {game.userCanAdmin && (
            <Link
              href={`/dashboard/partners/${partnerId}/games/${gameId}/client-ids/new`}
              className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-lg">➕</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Add Client ID</p>
                  <p className="text-2xl font-bold text-white">New</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Client IDs Section */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Client IDs</h2>
            {game.userCanAdmin && (
              <Link
                href={`/dashboard/partners/${partnerId}/games/${gameId}/client-ids/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <Eye className="h-4 w-4 mr-2" />
                Add Client ID
              </Link>
            )}
          </div>
          
          {clientIds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Client ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {clientIds.map((clientId) => (
                    <tr key={clientId.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {clientId.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {getClientTypeLabel(clientId.client_type || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                        {clientId.client_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          clientId.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}>
                          {clientId.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(clientId.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400">No client IDs created yet.</p>
              {game.userCanAdmin && (
                <Link
                  href={`/dashboard/partners/${partnerId}/games/${gameId}/client-ids/new`}
                  className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Add First Client ID
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 