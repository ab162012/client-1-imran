import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Lock, LogIn } from 'lucide-react';

const ADMIN_EMAILS = ["abdulbasit162012@gmail.com", "infoperfumeenclave@gmail.com"];

export const AdminLogin = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
        localStorage.setItem('adminToken', 'supabase-auth-token');
        navigate('/admin');
      } else if (session?.user) {
        // Logged in but not an admin
        setError('Access Denied: You do not have admin privileges.');
        await supabase.auth.signOut();
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
        localStorage.setItem('adminToken', 'supabase-auth-token');
        navigate('/admin');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin-login`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login.');
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
            Sign in with your authorized Google account.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 text-red-500 p-4 rounded-xl text-sm mb-6 font-medium border border-red-900">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white text-black font-medium rounded-2xl hover:bg-gray-200 transition-all shadow-lg shadow-white/20 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              'Verifying...'
            ) : (
              <>
                <LogIn size={20} />
                Sign in with Google
              </>
            )}
          </button>
          
          <p className="text-white/40 text-xs text-center">
            Only authorized administrators can access this area.
          </p>
        </div>
      </div>
    </div>
  );
};
