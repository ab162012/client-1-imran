import { 
  collection, 
  query, 
  getDocs, 
  limit, 
  startAfter, 
  orderBy, 
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
  getDocsFromCache,
  getDocsFromServer
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';

// --- CACHING CONFIG ---
const CACHE_KEY = 'perfume_enclave_products_cache';
const CACHE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

interface CachedData {
  products: Product[];
  timestamp: number;
}

export const ProductService = {
  /**
   * Aggregation: Uses count() to get total products in 1 single read.
   * Reduces cost significantly compared to fetching all documents.
   */
  getTotalCount: async (): Promise<number> => {
    try {
      const coll = collection(db, 'products');
      const snapshot = await getCountFromServer(coll);
      return snapshot.data().count;
    } catch (error) {
      console.error('[ProductService] Count error:', error);
      return 0;
    }
  },

  /**
   * Stale-While-Revalidate Strategy:
   * 1. Returns cached data from localStorage immediately (if available).
   * 2. Fetches fresh data from Firestore in the background.
   * 3. Updates the cache for the next visit.
   */
  getProductsSWR: async (onUpdate?: (products: Product[]) => void): Promise<Product[]> => {
    const cached = localStorage.getItem(CACHE_KEY);
    let initialProducts: Product[] = [];

    if (cached) {
      const parsed: CachedData = JSON.parse(cached);
      initialProducts = parsed.products;
      
      // If cache is still fresh, we might skip the background fetch
      // but for true SWR, we usually revalidate anyway.
      const isExpired = Date.now() - parsed.timestamp > CACHE_EXPIRATION_MS;
      if (!isExpired) {
        console.log('[ProductService] Cache fresh, returning early');
        return initialProducts;
      }
    }

    // Background Revalidation
    const fetchFreshData = async () => {
      try {
        console.log('[ProductService] Revalidating from server...');
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('name'));
        const snapshot = await getDocsFromServer(q);
        
        const freshProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        })) as Product[];

        // Update Cache
        const cacheData: CachedData = {
          products: freshProducts,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        if (onUpdate) onUpdate(freshProducts);
      } catch (error) {
        console.error('[ProductService] Revalidation failed:', error);
      }
    };

    // If we have cached data, return it and fetch in background
    if (initialProducts.length > 0) {
      fetchFreshData();
      return initialProducts;
    }

    // If no cache, we must wait for the first fetch
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    })) as Product[];

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      products,
      timestamp: Date.now()
    }));

    return products;
  },

  /**
   * Cursor-based Pagination:
   * Loads only 20 products at a time to minimize read quota usage.
   */
  getProductsPaginated: async (pageSize = 20, lastDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      const productsRef = collection(db, 'products');
      let q;
      
      if (lastDoc) {
        q = query(productsRef, orderBy('name'), startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(productsRef, orderBy('name'), limit(pageSize));
      }

      // Try cache first if persistence is enabled
      let snapshot;
      try {
        snapshot = await getDocsFromCache(q);
        if (snapshot.empty) {
          snapshot = await getDocsFromServer(q);
        }
      } catch (e) {
        snapshot = await getDocs(q);
      }

      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      return {
        products,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('[ProductService] Pagination error:', error);
      throw error;
    }
  },

  // Legacy support for existing components
  getProducts: async (forceRefresh = false): Promise<Product[]> => {
    return ProductService.getProductsSWR();
  }
};
