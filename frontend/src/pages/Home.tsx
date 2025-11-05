import { useAuth } from '../hooks/useAuth';
import { getAccessToken } from '../lib/axios';
import { useUserQuery } from '../hooks/useUserQuery';
import { useLogoutMutation } from '../hooks/useLogoutMutation';

export default function Home() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useUserQuery();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-[9px] shadow-lg p-8 border border-gray-200 text-center space-y-4">
        <h1 className="text-3xl font-bold text-purple-500 tracking-tighter sm:text-4xl md:text-5xl">Welcome</h1>
        <p className="text-green-600 font-medium">You have logged in successfully.</p>
        {isLoading && (
          <div className="mt-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
            <div className="h-3 bg-gray-100 rounded w-5/6 mx-auto" />
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-600">{error instanceof Error ? error.message : 'Failed to load user.'}</p>
        )}
        {(data?.user || user) && !isLoading && (
          <div className="mt-4">
            <p className="text-gray-600">Welcome <span className="font-medium text-purple-500">{(data?.user || user)?.email}!</span></p>
            <p className="text-gray-600 break-all mt-2">Current access token: <span className="font-mono">{getAccessToken() || 'N/A'}</span></p>
          </div>
        )}
        <div className="mt-6">
          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="bg-red-500 disabled:opacity-60 text-white py-2 px-6 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}