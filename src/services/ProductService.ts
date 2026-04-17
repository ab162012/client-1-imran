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

  getProductsPaginated: async (pageSize = 12, lastDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      const productsRef = ProductService.getCollectionRef();
      // Standard query by creation date
      const q = lastDoc 
        ? query(productsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize))
        : query(productsRef, orderBy('createdAt', 'desc'), limit(pageSize));
      
      const snapshot = await getDocs(q);
      let products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      // Prioritize signature products in-memory at the top
      // This ensures they appear first even if they are older or missing priority fields
      const signatureIds = ['caliber', 'deep-blue']; // Use IDs if known, or name check
      const signatureProducts = products.filter(p => 
        signatureIds.includes(p.id.toLowerCase()) || 
        p.name.toLowerCase().includes('caliber') || 
        p.name.toLowerCase().includes('deep blue')
      );
      const otherProducts = products.filter(p => !signatureProducts.includes(p));

      // Re-assemble (if first page, put signature ones on top)
      const finalProducts = lastDoc ? products : [...signatureProducts, ...otherProducts];

      return {
        products: finalProducts,
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
      const q = query(productsRef, orderBy('featured', 'desc'), limit(15));
      const snapshot = await getDocs(q);
      let products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      // Always show signature products first in featured section
      const signatureProducts = products.filter(p => 
        p.name.toLowerCase().includes('caliber') || 
        p.name.toLowerCase().includes('deep blue')
      );
      const otherFeatured = products.filter(p => !signatureProducts.includes(p));
      const finalFeatured = [...signatureProducts, ...otherFeatured];

      productCache[cacheKey] = { data: finalFeatured, timestamp: Date.now() };
      return finalFeatured;
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
