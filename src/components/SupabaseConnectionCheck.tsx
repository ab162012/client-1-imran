import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { AlertTriangle, Database, ExternalLink } from 'lucide-react';

export const SupabaseConnectionCheck: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'not-configured'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus('not-configured');
      return;
    }

    const checkConnection = async () => {
      try {
        // Try to fetch a single row from settings to verify connection
        const { error } = await supabase.from('settings').select('id').limit(1);
        
        if (error) {
          // If the error is "Failed to fetch", it's a network/URL issue
          if (error.message?.includes('fetch') || error.message?.includes('NetworkError')) {
            setStatus('error');
            setErrorMessage('Could not connect to Supabase. Please check your URL and network connection.');
          } else if (error.code === 'PGRST116') {
            // This is "no rows found", which is fine for a connection test
            setStatus('connected');
          } else {
            // Other Supabase errors (like table not found)
            setStatus('error');
            setErrorMessage(error.message);
          }
        } else {
          setStatus('connected');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred while connecting to Supabase.');
      }
    };

    checkConnection();
  }, []);

  if (status === 'connected' || status === 'checking') return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-2xl px-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-white border-2 border-red-500 rounded-3xl shadow-2xl p-6 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="bg-red-50 p-4 rounded-2xl">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-black mb-1">Database Connection Issue</h3>
          <p className="text-blue-dark/70 text-sm font-medium mb-4">
            {status === 'not-configured' 
              ? 'Supabase is not configured. Please set your environment variables in the AI Studio settings.' 
              : `Failed to connect to Supabase: ${errorMessage}`}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-blue-dark transition-colors"
            >
              <Database size={14} className="mr-2" /> Supabase Dashboard <ExternalLink size={12} className="ml-2" />
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-light text-black text-xs font-bold rounded-xl hover:bg-blue transition-colors border-2 border-blue"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
