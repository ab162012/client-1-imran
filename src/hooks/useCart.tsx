import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('perfume_enclave_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('perfume_enclave_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync cart items with latest data from Firestore
  useEffect(() => {
    const syncCart = async () => {
      if (cart.length === 0) return;

      try {
        const updatedCart = await Promise.all(
          cart.map(async (item) => {
            try {
              const docRef = doc(db, 'products', item.id);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                const latestData = docSnap.data() as Product;
                // Ensure image is correctly picked from images array if main image is missing
                const latestImage = latestData.image || (latestData.images && latestData.images.length > 0 ? latestData.images[0] : '');
                
                // Only update if data actually changed to avoid unnecessary re-renders
                if (
                  Number(latestData.price) !== Number(item.price) || 
                  latestData.name !== item.name || 
                  latestImage !== item.image ||
                  Number(latestData.original_price) !== Number(item.original_price)
                ) {
                  return { 
                    ...item, 
                    ...latestData, 
                    price: Number(latestData.price), 
                    original_price: latestData.original_price ? Number(latestData.original_price) : undefined,
                    image: latestImage
                  };
                }
                return item;
              }
              // If product no longer exists, we'll filter it out later
              return null;
            } catch (err) {
              console.error(`Error syncing item ${item.id}:`, err);
              return item;
            }
          })
        );

        // Filter out nulls (deleted products) and check for changes
        const filteredCart = updatedCart.filter((item): item is CartItem => item !== null);
        const hasChanges = filteredCart.length !== cart.length || filteredCart.some((item, idx) => item !== cart[idx]);
        
        if (hasChanges) {
          setCart(filteredCart);
        }
      } catch (error) {
        console.error('Error syncing cart:', error);
      }
    };

    syncCart();
  }, []); // Run once on mount to refresh stale data from localStorage

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { 
        ...product, 
        price: Number(product.price), 
        original_price: product.original_price ? Number(product.original_price) : undefined,
        image: product.image || (product.images && product.images.length > 0 ? product.images[0] : ''),
        quantity 
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Buy 5 Get 1 Free: For every 6 items, 1 is free.
  // We need to find the cheapest item to make free.
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const rawTotalPrice = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  
  const calculateFreeItems = () => {
    const freeItemsCount = Math.floor(totalItemsCount / 6);
    if (freeItemsCount === 0) return 0;

    // Create a flat list of all item prices in the cart to find the cheapest ones
    const allPrices: number[] = [];
    cart.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        allPrices.push(Number(item.price));
      }
    });
    
    // Sort prices ascending and take the first 'freeItemsCount' prices
    allPrices.sort((a, b) => a - b);
    const discount = allPrices.slice(0, freeItemsCount).reduce((sum, price) => sum + price, 0);
    
    return discount;
  };

  const finalPrice = rawTotalPrice - calculateFreeItems();

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems: totalItemsCount, totalPrice: finalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
