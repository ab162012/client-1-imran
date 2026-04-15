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
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { STORE_ID } from '../constants';

export const OrderService = {
  /**
   * Gets the collection reference for orders scoped to the current store.
   */
  getCollectionRef: () => {
    return collection(db, 'stores', STORE_ID, 'orders');
  },

  /**
   * Submits a new order with error handling for UI.
   */
  submitOrder: async (orderData: any) => {
    try {
      const ordersRef = OrderService.getCollectionRef();
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      return { success: true, orderId: docRef.id };
    } catch (error) {
      console.error('Order submission failed:', error);
      return { success: false, error: 'Failed to place order. Please try again.' };
    }
  },

  /**
   * Fetches orders with pagination.
   */
  getOrdersPaginated: async (pageSize = 15, lastDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      const ordersRef = OrderService.getCollectionRef();
      let q;
      
      if (lastDoc) {
        q = query(ordersRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(ordersRef, orderBy('createdAt', 'desc'), limit(pageSize));
      }

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      return {
        orders,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `stores/${STORE_ID}/orders`);
      throw error;
    }
  },

  /**
   * Updates an order status.
   */
  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      const orderRef = doc(db, 'stores', STORE_ID, 'orders', orderId);
      await updateDoc(orderRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${STORE_ID}/orders/${orderId}`);
      throw error;
    }
  },

  /**
   * Deletes an order.
   */
  deleteOrder: async (orderId: string) => {
    try {
      const orderRef = doc(db, 'stores', STORE_ID, 'orders', orderId);
      await deleteDoc(orderRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stores/${STORE_ID}/orders/${orderId}`);
      throw error;
    }
  }
};
