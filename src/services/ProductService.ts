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
  getDocsFromServer,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';
import { STORE_ID } from '../constants';

// --- SIMPLE IN-MEMORY CACHE ---
const productCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const ProductService = {
  /**
   * Gets the collection reference for products scoped to the current store.
   */
  getCollectionRef: () => {
    return collection(db, 'stores', STORE_ID, 'products');
  },

  /**
   * Optimized count aggregation scoped to store.
   */
  getProductCount: async (): Promise<number> => {
    try {
      const coll = ProductService.getCollectionRef();
      const snapshot = await getCountFromServer(coll);
      return snapshot.data().count;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `stores/${STORE_ID}/products`);
      return 0;
    }
  },

  /**
   * Fetches a single product by ID with caching.
   */
  getProductById: async (id: string): Promise<Product | null> => {
    const cacheKey = `product_${id}`;
    if (productCache[cacheKey] && (Date.now() - productCache[cacheKey].timestamp < CACHE_TTL)) {
      return productCache[cacheKey].data;
    }

    try {
      const docRef = doc(db, 'stores', STORE_ID, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Product;
        productCache[cacheKey] = { data, timestamp: Date.now() };
        return data;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `stores/${STORE_ID}/products/${id}`);
      return null;
    }
  },

  /**
   * Scalable cursor-based pagination scoped to store.
   * Loads 12 products at a time (optimized for grid layouts).
   */
  getProductsPaginated: async (pageSize = 12, lastDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      const productsRef = ProductService.getCollectionRef();
      let q;
      
      if (lastDoc) {
        q = query(productsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(productsRef, orderBy('createdAt', 'desc'), limit(pageSize));
      }

      // Try cache first, then server
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
      handleFirestoreError(error, OperationType.LIST, `stores/${STORE_ID}/products`);
      throw error;
    }
  },

  /**
   * Fetches all featured products with caching.
   */
  getFeaturedProducts: async (): Promise<Product[]> => {
    const cacheKey = 'featured_products';
    if (productCache[cacheKey] && (Date.now() - productCache[cacheKey].timestamp < CACHE_TTL)) {
      return productCache[cacheKey].data;
    }

    try {
      const productsRef = ProductService.getCollectionRef();
      const q = query(productsRef, orderBy('featured', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      productCache[cacheKey] = { data: products, timestamp: Date.now() };
      return products;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `stores/${STORE_ID}/products`);
      return [];
    }
  },

  /**
   * Updates a product.
   */
  updateProduct: async (id: string, productData: Partial<Product>) => {
    try {
      const docRef = doc(db, 'stores', STORE_ID, 'products', id);
      await updateDoc(docRef, productData);
      // Clear cache for this product
      delete productCache[`product_${id}`];
      delete productCache['featured_products'];
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${STORE_ID}/products/${id}`);
      throw error;
    }
  },

  /**
   * Adds a new product.
   */
  addProduct: async (productData: any) => {
    try {
      const productsRef = ProductService.getCollectionRef();
      const docRef = await addDoc(productsRef, {
        ...productData,
        createdAt: serverTimestamp()
      });
      delete productCache['featured_products'];
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `stores/${STORE_ID}/products`);
      throw error;
    }
  },

  /**
   * Deletes a product.
   */
  deleteProduct: async (id: string) => {
    try {
      const docRef = doc(db, 'stores', STORE_ID, 'products', id);
      await deleteDoc(docRef);
      delete productCache[`product_${id}`];
      delete productCache['featured_products'];
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stores/${STORE_ID}/products/${id}`);
      throw error;
    }
  }
};
