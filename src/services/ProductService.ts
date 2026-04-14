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
   * Optimized count aggregation.
   * Reduces 1000+ reads to 1 single read.
   */
  getProductCount: async (): Promise<number> => {
    try {
      const coll = collection(db, 'products');
      const snapshot = await getCountFromServer(coll);
      return snapshot.data().count;
    } catch (error) {
      console.error('[ProductService] Error getting count:', error);
      return 0;
    }
  },

  /**
   * Fetches products with a Stale-While-Revalidate (SWR) strategy.
   * Returns cached data immediately if available, then updates from server.
   */
  getProducts: async (onUpdate?: (products: Product[]) => void): Promise<Product[]> => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('name'));

      // 1. Try to get from cache first (Stale)
      let products: Product[] = [];
      try {
        const cacheSnapshot = await getDocsFromCache(q);
        if (!cacheSnapshot.empty) {
          products = cacheSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
          })) as Product[];
          console.log('[ProductService] Serving from local cache (SWR)');
          if (onUpdate) onUpdate(products);
        }
      } catch (e) {
        console.log('[ProductService] Cache miss or not available');
      }

      // 2. Revalidate from server
      const serverSnapshot = await getDocsFromServer(q);
      const serverProducts = serverSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      console.log('[ProductService] Revalidated from server');
      if (onUpdate) onUpdate(serverProducts);
      
      return serverProducts;
    } catch (error) {
      console.error('[ProductService] Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Scalable cursor-based pagination.
   * Loads only 20 products at a time.
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

      // Use getDocs which automatically handles cache/server based on persistence
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      return {
        products,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('[ProductService] Pagination error:', error);
      throw error;
    }
  }
};
