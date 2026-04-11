import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { Lock } from 'lucide-react';

export const AdminLogin = () => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid response');
      }
      
      if (data.success) {
        // Sign in anonymously to Firebase to satisfy security rules
        try {
          await signInAnonymously(auth);
        } catch (authError) {
          console.warn("Anonymous auth restricted, proceeding with local token only:", authError);
        }
        localStorage.setItem('adminToken', data.token);
        navigate('/admin');
      } else {
        setError(data.message || 'Invalid Admin Key');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message === 'Failed to fetch' 
        ? 'Could not connect to server. Please ensure the backend is running.' 
        : `Error: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black rounded-3xl shadow-xl p-8 border border-white">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-white/20">
            <Lock className="text-black" size={32} />
          </div>
          <h1 className="text-2xl font-medium text-white">Admin Access</h1>
          <p className="text-white/60 text-sm mt-2 text-center">
            Enter your secure admin key to continue.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 text-red-500 p-4 rounded-xl text-sm mb-6 font-medium border border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Admin Key</label>
            <input
              type="password"
              required
              placeholder="Enter Access Key"
              className="w-full p-4 border border-white bg-black text-white rounded-2xl focus:ring-2 focus:ring-white outline-none transition-all"
              value={key || ''}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black font-medium rounded-2xl hover:bg-blue-light transition-all shadow-lg shadow-white/20 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
