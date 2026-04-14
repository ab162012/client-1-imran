import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// --- ANTI-SPAM CONFIG ---
const SUBMISSION_COOLDOWN_MS = 30 * 1000; // 30 seconds between orders
let lastSubmissionTime = 0;

export const OrderService = {
  /**
   * Submits an order with validation and anti-spam protection.
   */
  submitOrder: async (orderData: {
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
    };
    products: any[];
    total: number;
  }) => {
    try {
      // 1. Basic Validation
      const { name, phone, address, city } = orderData.customer;
      if (!name || !phone || !address || !city) {
        throw new Error('Missing required customer information');
      }

      if (!orderData.products || orderData.products.length === 0) {
        throw new Error('Cart is empty');
      }

      // 2. Anti-Spam (Cooldown)
      const now = Date.now();
      if (now - lastSubmissionTime < SUBMISSION_COOLDOWN_MS) {
        const remaining = Math.ceil((SUBMISSION_COOLDOWN_MS - (now - lastSubmissionTime)) / 1000);
        throw new Error(`Please wait ${remaining} seconds before placing another order.`);
      }

      // 3. Prepare Data
      const finalOrder = {
        ...orderData,
        products: orderData.products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: p.quantity,
          size: p.selectedSize || '50ml'
        })),
        status: 'pending',
        timestamp: serverTimestamp(), // Use server-side timestamp for security
        createdAt: new Date().toISOString()
      };

      // 4. Save to Firestore
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, finalOrder);
      
      // Update last submission time
      lastSubmissionTime = Date.now();

      return {
        success: true,
        orderId: docRef.id
      };
    } catch (error: any) {
      console.error('[OrderService] Order submission failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to place order'
      };
    }
  }
};
