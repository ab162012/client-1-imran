import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { SiteSettings } from '../types';

import { STORE_ID } from '../constants';

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
    const unsubscribe = onSnapshot(doc(db, 'stores', STORE_ID, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const newSettings = { ...defaultSettings, ...docSnap.data() } as SiteSettings;
        setSettings(newSettings);
        
        // Apply primary color dynamically
        // if (newSettings.primaryColor) {
        //   document.documentElement.style.setProperty('--color-blue', newSettings.primaryColor);
        // }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
