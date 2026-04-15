import { 
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { STORE_ID } from '../constants';
import { SiteSettings } from '../types';

export const SettingsService = {
  /**
   * Gets the document reference for store settings.
   */
  getDocRef: () => {
    return doc(db, 'stores', STORE_ID, 'settings', 'general');
  },

  /**
   * Fetches store settings.
   */
  getSettings: async (): Promise<SiteSettings | null> => {
    try {
      const docRef = SettingsService.getDocRef();
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as SiteSettings;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `stores/${STORE_ID}/settings/general`);
      return null;
    }
  },

  /**
   * Updates store settings.
   */
  updateSettings: async (settings: SiteSettings) => {
    try {
      const docRef = SettingsService.getDocRef();
      await setDoc(docRef, settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${STORE_ID}/settings/general`);
      throw error;
    }
  }
};
