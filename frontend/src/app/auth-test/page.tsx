'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import authManager from '@/lib/vendure/auth-manager';

export default function AuthTestPage() {
  const { customer, currentUser, loading, error, login, logout, refreshCustomer } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('newtest@example.com');
  const [password, setPassword] = useState('password123');
  const [loginStatus, setLoginStatus] = useState('');

  useEffect(() => {
    // Get the current token from auth manager
    const currentToken = authManager.getToken();
    setToken(currentToken);
  }, [customer]);

  const handleTestLogin = async () => {
    setLoginStatus('Logging in...');
    try {
      const success = await login(email, password, true);
      if (success) {
        setLoginStatus('Login successful! Refreshing customer...');
        await refreshCustomer();
        setLoginStatus('Customer refreshed!');
        const newToken = authManager.getToken();
        setToken(newToken);
      } else {
        setLoginStatus('Login failed');
      }
    } catch (err) {
      setLoginStatus(`Login error: ${err}`);
    }
  };

  const handleRefresh = async () => {
    setLoginStatus('Refreshing customer...');
    await refreshCustomer();
    setLoginStatus('Customer refreshed!');
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>

        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>

          <div className="space-y-2">
            <div className="flex">
              <span className="font-medium w-32">Loading:</span>
              <span className={loading ? 'text-yellow-600' : 'text-gray-600'}>
                {loading ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex">
              <span className="font-medium w-32">Customer:</span>
              <span className={customer ? 'text-green-600' : 'text-red-600'}>
                {customer ? `${customer.emailAddress} (${customer.firstName} ${customer.lastName})` : 'Not logged in'}
              </span>
            </div>

            <div className="flex">
              <span className="font-medium w-32">Current User:</span>
              <span className={currentUser ? 'text-green-600' : 'text-gray-600'}>
                {currentUser ? currentUser.identifier : 'None'}
              </span>
            </div>

            <div className="flex">
              <span className="font-medium w-32">Auth Token:</span>
              <span className={token ? 'text-green-600 font-mono text-xs' : 'text-red-600'}>
                {token ? token.substring(0, 20) + '...' : 'No token'}
              </span>
            </div>

            <div className="flex">
              <span className="font-medium w-32">Error:</span>
              <span className={error ? 'text-red-600' : 'text-gray-600'}>
                {error || 'None'}
              </span>
            </div>

            <div className="flex">
              <span className="font-medium w-32">Login Status:</span>
              <span className="text-blue-600">{loginStatus || 'Ready'}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <button
              onClick={handleTestLogin}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Test Login
            </button>
          </div>
        </div>

        <div className="mb-8 space-x-4">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Refresh Customer
          </button>

          <button
            onClick={() => logout()}
            disabled={loading || !customer}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Logout
          </button>

          <Link
            href="/"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Go Home
          </Link>

          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Login Page
          </Link>
        </div>

        <div className="p-6 bg-yellow-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <p className="text-sm text-gray-600 mb-2">
            Check browser console for detailed logs. The authentication should:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Send login request with credentials</li>
            <li>Receive vendure-auth-token in response</li>
            <li>Store token in localStorage</li>
            <li>Include token in subsequent requests</li>
            <li>Fetch and display customer data</li>
            <li>Update NavigationHeader to show logged-in state</li>
          </ol>
        </div>
      </div>
    </div>
  );
}