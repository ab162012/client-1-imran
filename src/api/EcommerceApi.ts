import { supabase } from '../lib/supabase';
import { CartItem } from '../types';

export const EcommerceApi = {
  initializeCheckout: async (cart: CartItem[], customerData: any) => {
    try {
      // 1. Fetch all product data
      const productIds = cart.map(item => item.id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (productsError) throw new Error(productsError.message);

      // 2. Verify stock and calculate total
      let latestTotal = 0;
      const productsWithLatestData = cart.map((item) => {
        const product = products?.find(p => p.id === item.id);
        if (!product) throw new Error(`Product ${item.name} not found.`);
        
        const currentStock = product.stock || 0;
        const latestPrice = Number(product.price || item.price);
        
        if (currentStock < item.quantity) {
          throw new Error(`Not enough stock for ${item.name}. Only ${currentStock} left.`);
        }

        latestTotal += latestPrice * item.quantity;
        
        return {
          id: item.id,
          name: product.name || item.name,
          price: latestPrice,
          quantity: item.quantity
        };
      });

      // 3. Update stock (Non-atomic, but functional for prototype)
      for (const item of cart) {
        const product = products?.find(p => p.id === item.id);
        const newStock = (product?.stock || 0) - item.quantity;
        const newSold = (product?.soldQuantity || 0) + item.quantity;
        const threshold = product?.lowStockThreshold || 5;

        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock: newStock,
            soldQuantity: newSold,
            stockStatus: newStock === 0 ? 'Out of Stock' : newStock <= threshold ? 'Limited' : 'In Stock'
          })
          .eq('id', item.id);
        
        if (updateError) throw new Error(updateError.message);
      }

      // 4. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer: customerData,
          products: productsWithLatestData,
          total: latestTotal,
          status: 'pending',
          timestamp: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) throw new Error(orderError.message);

      // Send email notification to admin
      try {
        await fetch('/api/order-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            customerEmail: customerData.email,
            total: latestTotal
          })
        });
      } catch (e) {
        console.warn("Failed to send admin notification:", e);
      }
      
      return {
        success: true,
        orderId: order.id
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
