import React from 'react';
import { useCart } from '../hooks/useCart';
import { X, ShoppingBag, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          
          {/* Drawer */}
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col border-l-2 border-blue"
          >
            <div className="p-6 border-b-2 border-blue flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="text-black" size={24} />
                <h2 className="text-xl font-bold text-black">Your Cart 🛒</h2>
                <span className="bg-blue-light text-black border-2 border-blue text-xs font-bold px-2 py-1 rounded-full">
                  {totalItems} items
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {cart.length > 0 && (
                  <button 
                    onClick={() => { if(window.confirm('Clear all items from cart?')) clearCart(); }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Clear Cart"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={onClose} className="p-2 text-black hover:bg-blue-light rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-blue-light rounded-full flex items-center justify-center text-blue-dark border-2 border-blue">
                    <ShoppingBag size={40} />
                  </div>
                  <p className="text-blue-dark/60 font-bold">Your cart is empty</p>
                  <button
                    onClick={() => { onClose(); navigate('/shop'); }}
                    className="text-black font-bold hover:text-blue-dark underline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex space-x-4">
                    <div className="w-20 h-20 bg-blue-light rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-blue">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ShoppingBag size={24} className="text-blue-dark" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-black truncate">{item.name}</h3>
                      <p className="text-[10px] font-black text-blue-dark/40 uppercase mb-1">{item.selectedSize || '50ml'}</p>
                      <p className="text-black font-bold text-sm">PKR {Number(item.price).toLocaleString()}</p>
                      <div className="mt-2 flex items-center space-x-3">
                        <div className="flex items-center border-2 border-blue rounded-full px-2 py-1 bg-white">
                          <button onClick={() => updateQuantity(item.id, item.selectedSize || '50ml', item.quantity - 1)} className="p-1 text-blue-dark/40 hover:text-black">
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.selectedSize || '50ml', item.quantity + 1)} className="p-1 text-blue-dark/40 hover:text-black">
                            <Plus size={14} />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id, item.selectedSize || '50ml')} className="text-blue-dark/40 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-black">PKR {(Number(item.price) * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t-2 border-blue bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-dark/60 font-bold">Total Amount</span>
                  <span className="text-2xl font-bold text-black">PKR {totalPrice.toLocaleString()}</span>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => { onClose(); navigate('/checkout'); }}
                    className="w-full bg-black text-white py-4 rounded-full font-bold flex items-center justify-center space-x-2 hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={20} />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/shop'); }}
                    className="w-full bg-white text-black border-2 border-blue py-3.5 rounded-full font-bold flex items-center justify-center hover:bg-blue-light transition-all"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};
