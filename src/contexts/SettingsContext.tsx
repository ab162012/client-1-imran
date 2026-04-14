import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { SiteSettings } from '../types';

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  websiteName: 'Perfume Enclave',
  logo: '',
  primaryColor: '#1E3A8A',
  footerText: '© 2026 Perfume Enclave. All rights reserved.',
  instagramUrl: '#',
  facebookUrl: '#',
  heroProductId: ''
};

const SettingsContext = createContext<SettingsContextType>({ settings: defaultSettings, loading: true });

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'general')
        .single();
      
      if (!error && data) {
        setSettings({ ...defaultSettings, ...data } as SiteSettings);
      }
      setLoading(false);
    };

    fetchSettings();

    const channel = supabase
      .channel('settings-general')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.general' }, fetchSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
