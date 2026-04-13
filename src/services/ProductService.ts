import { 
  collection, 
  query, 
  getDocs, 
  limit, 
  startAfter, 
  orderBy, 
  QueryDocumentSnapshot,
  DocumentData
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
   * Fetches products with an optimized caching strategy.
   * Only calls Firestore if cache is empty or expired.
   */
  getProducts: async (forceRefresh = false): Promise<Product[]> => {
    try {
      // 1. Check local cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && !forceRefresh) {
        const parsed: CachedData = JSON.parse(cached);
        const isExpired = Date.now() - parsed.timestamp > CACHE_EXPIRATION_MS;
        
        if (!isExpired) {
          console.log('[ProductService] Serving from cache');
          return parsed.products;
        }
      }

      // 2. Fetch from Firestore if no valid cache
      console.log('[ProductService] Fetching from Firestore (Cache miss/expired)');
      const productsRef = collection(db, 'products');
      // We fetch all products in one go since the catalog is small (6-15 items)
      // This minimizes the number of read operations.
      const q = query(productsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      // 3. Update cache
      const cacheData: CachedData = {
        products,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      return products;
    } catch (error) {
      console.error('[ProductService] Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Scalable pagination implementation.
   * Ready for 100+ products.
   */
  getProductsPaginated: async (pageSize: number, lastDoc: QueryDocumentSnapshot<DocumentData> | null) => {
    try {
      const productsRef = collection(db, 'products');
      let q;
      
      if (lastDoc) {
        q = query(productsRef, orderBy('name'), startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(productsRef, orderBy('name'), limit(pageSize));
      }

      const snapshot = await getDocs(q);
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
  }
};
