import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { CartItem } from '../types';

export const EcommerceApi = {
  initializeCheckout: async (cart: CartItem[], customerData: any) => {
    try {
      // Calculate Buy 5 Get 1 Free discount
      let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      const freeItemsCount = Math.floor(totalItemsCount / 6);
      
      if (freeItemsCount > 0) {
        const allPrices: number[] = [];
        cart.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            allPrices.push(Number(item.price));
          }
        });
        allPrices.sort((a, b) => a - b);
        const discount = allPrices.slice(0, freeItemsCount).reduce((sum, price) => sum + price, 0);
        total -= discount;
      }

      const orderData = {
        customer: customerData,
        products: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: total,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      const orderId = orderRef.id;
      
      // Send email notification to admin
      try {
        await fetch('/api/order-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            customer: customerData,
            products: orderData.products,
            total: total,
            timestamp: orderData.timestamp
          })
        });
      } catch (e) {
        console.warn("Failed to send admin notification:", e);
      }
      
      return {
        success: true,
        orderId
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'checkout');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
