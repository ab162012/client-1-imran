import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';

const ADMIN_KEY = "Imran101";

export const AdminLogin = () => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token === ADMIN_KEY) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (key === ADMIN_KEY) {
      localStorage.setItem('adminToken', ADMIN_KEY);
      navigate('/admin');
    } else {
      setError('Invalid Admin Key. Please try again.');
    }
    setLoading(false);
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
            Enter your secret admin key to continue.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 text-red-500 p-4 rounded-xl text-sm mb-6 font-medium border border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              placeholder="Enter Admin Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-white/20 bg-white/5 text-white focus:border-white outline-none transition-all font-medium"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black font-medium rounded-2xl hover:bg-gray-200 transition-all shadow-lg shadow-white/20 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              'Verifying...'
            ) : (
              <>
                <LogIn size={20} />
                Access Dashboard
              </>
            )}
          </button>
          
          <p className="text-white/40 text-xs text-center">
            Only authorized administrators can access this area.
          </p>
        </form>
      </div>
    </div>
  );
};
