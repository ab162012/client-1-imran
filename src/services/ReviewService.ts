import { 
  collection, 
  query, 
  getDocs, 
  limit, 
  startAfter, 
  orderBy, 
  QueryDocumentSnapshot,
  DocumentData,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { STORE_ID } from '../constants';
import { Review } from '../types';

export const ReviewService = {
  /**
   * Gets the collection reference for reviews scoped to the current store.
   */
  getCollectionRef: () => {
    return collection(db, 'stores', STORE_ID, 'reviews');
  },

  /**
   * Fetches reviews for a specific product.
   */
  getReviewsByProduct: async (productId: string) => {
    try {
      const reviewsRef = ReviewService.getCollectionRef();
      const q = query(reviewsRef, where('productId', '==', productId), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Review[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `stores/${STORE_ID}/reviews`);
      return [];
    }
  },

  /**
   * Adds a new review.
   */
  addReview: async (reviewData: any) => {
    try {
      const reviewsRef = ReviewService.getCollectionRef();
      const docRef = await addDoc(reviewsRef, {
        ...reviewData,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `stores/${STORE_ID}/reviews`);
      throw error;
    }
  },

  /**
   * Updates a review status (e.g., for moderation).
   */
  updateReviewStatus: async (reviewId: string, status: string) => {
    try {
      const reviewRef = doc(db, 'stores', STORE_ID, 'reviews', reviewId);
      await updateDoc(reviewRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${STORE_ID}/reviews/${reviewId}`);
      throw error;
    }
  },

  /**
   * Deletes a review.
   */
  deleteReview: async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'stores', STORE_ID, 'reviews', reviewId);
      await deleteDoc(reviewRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stores/${STORE_ID}/reviews/${reviewId}`);
      throw error;
    }
  }
};
