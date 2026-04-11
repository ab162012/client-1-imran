import { db } from '../firebase';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { CartItem } from '../types';

export const EcommerceApi = {
  initializeCheckout: async (cart: CartItem[], customerData: any) => {
    try {
      let orderId = '';
      let latestTotal = 0;

      await runTransaction(db, async (transaction) => {
        // 1. Read all product documents first
        const productDocs = await Promise.all(
          cart.map(item => transaction.get(doc(db, 'products', item.id)))
        );

        // 2. Verify stock and calculate latest total
        latestTotal = 0;
        const productsWithLatestData = cart.map((item, index) => {
          const productDoc = productDocs[index];
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.name} not found.`);
          }
          
          const data = productDoc.data();
          const currentStock = data.stock || 0;
          const latestPrice = Number(data.price || item.price);
          
          if (currentStock < item.quantity) {
            throw new Error(`Not enough stock for ${item.name}. Only ${currentStock} left.`);
          }

          latestTotal += latestPrice * item.quantity;
          
          return {
            id: item.id,
            name: data.name || item.name,
            price: latestPrice,
            quantity: item.quantity
          };
        });

        // 3. Perform writes (Update stock)
        productDocs.forEach((productDoc, index) => {
          const data = productDoc.data()!;
          const currentStock = data.stock || 0;
          const currentSold = data.soldQuantity || 0;
          const newStock = currentStock - cart[index].quantity;
          const threshold = data.lowStockThreshold || 5;
          
          transaction.update(doc(db, 'products', cart[index].id), {
            stock: newStock,
            soldQuantity: currentSold + cart[index].quantity,
            stockStatus: newStock === 0 ? 'Out of Stock' : newStock <= threshold ? 'Limited' : 'In Stock'
          });
        });

        // 4. Create order
        const orderData = {
          customer: customerData,
          products: productsWithLatestData,
          total: latestTotal,
          status: 'pending',
          timestamp: new Date().toISOString()
        };

        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, orderData);
        orderId = orderRef.id;
      });
      
      // Send email notification to admin
      try {
        await fetch('/api/order-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            customerEmail: customerData.email,
            total: latestTotal
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
      console.error('Checkout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
