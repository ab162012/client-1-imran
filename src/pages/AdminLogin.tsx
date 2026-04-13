import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { Lock, Mail, Key, Loader2 } from 'lucide-react';

export const AdminLogin = () => {
  const [email, setEmail] = useState('admin@perfumeenclave.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        navigate('/admin');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success will be handled by onAuthStateChanged
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Invalid email or password';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid Admin Credentials. Please check your email and password.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      }
      
      setError(message);
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
            Sign in with your admin credentials to manage your store.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 text-red-500 p-4 rounded-xl text-sm mb-6 font-medium border border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                required
                placeholder="admin@example.com"
                className="w-full pl-12 pr-4 py-4 border border-white bg-black text-white rounded-2xl focus:ring-2 focus:ring-white outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Password / Access Key</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="password"
                required
                placeholder="Enter Password"
                className="w-full pl-12 pr-4 py-4 border border-white bg-black text-white rounded-2xl focus:ring-2 focus:ring-white outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-blue-light transition-all shadow-lg shadow-white/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Access Dashboard</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/40 text-xs">
            Note: Ensure Email/Password authentication is enabled in your Firebase Console.
            Authorized Admins: admin@perfumeenclave.com, abdulbasit162012@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};
