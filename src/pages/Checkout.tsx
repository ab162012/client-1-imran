import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CheckCircle2, CreditCard, Truck, Loader2, ShoppingBag } from 'lucide-react';
import { OrderService } from '../services/OrderService';

export const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions.');
      return;
    }
    setLoading(true);
    
    const result = await OrderService.submitOrder({
      customer: formData,
      products: cart,
      total: totalPrice
    });
    
    if (result.success) {
      clearCart();
      navigate('/success', { state: { orderId: result.orderId } });
    } else {
      alert(result.error);
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/shop');
    return null;
  }

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-black mb-12">Checkout 💳</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form Section */}
          <div className="space-y-10">
            <section className="bg-blue-light p-8 rounded-3xl border-2 border-blue shadow-sm">
              <h2 className="text-xl font-bold text-black mb-8 flex items-center">
                <Truck className="mr-3 text-blue-dark" size={24} />
                Shipping Information
              </h2>
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-blue-dark/60 mb-2">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-blue bg-white text-black focus:border-black outline-none transition-all font-medium"
                      placeholder="Enter your full name"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-dark/60 mb-2">Email Address</label>
                    <input
                      required
                      type="email"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-blue bg-white text-black focus:border-black outline-none transition-all font-medium"
                      placeholder="your@email.com"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-dark/60 mb-2">Phone Number</label>
                    <input
                      required
                      type="tel"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-blue bg-white text-black focus:border-black outline-none transition-all font-medium"
                      placeholder="+1 234 567 890"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-dark/60 mb-2">Delivery Address</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-blue bg-white text-black focus:border-black outline-none transition-all font-medium"
                      placeholder="Street name, house number"
                      value={formData.address || ''}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-dark/60 mb-2">City</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-blue bg-white text-black focus:border-black outline-none transition-all font-medium"
                      placeholder="Your city"
                      value={formData.city || ''}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="terms"
                      className="w-5 h-5 border-2 border-blue rounded text-blue-dark focus:ring-blue-dark"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                    />
                    <label htmlFor="terms" className="ml-3 text-sm font-bold text-black">
                      I agree to the terms and conditions
                    </label>
                  </div>
                </div>
              </form>
            </section>

            <section className="bg-blue-light p-8 rounded-3xl border-2 border-blue shadow-sm">
              <h2 className="text-xl font-bold text-black mb-8 flex items-center">
                <CreditCard className="mr-3 text-blue-dark" size={24} />
                Payment Method
              </h2>
              <div className="p-6 border-2 border-blue bg-white rounded-2xl flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white mr-4 shadow-lg">
                    $
                  </div>
                  <div>
                    <p className="font-bold text-black">Cash on Delivery</p>
                    <p className="text-sm text-blue-dark/60 font-medium">Pay securely at your doorstep</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full border-4 border-black bg-white" />
              </div>
            </section>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-1">
            <div className="bg-blue-light p-8 rounded-3xl border-2 border-blue sticky top-32 shadow-xl">
              <h2 className="text-xl font-bold text-black mb-8">Order Summary</h2>
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex items-center justify-center border-2 border-blue">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ShoppingBag size={20} className="text-blue-dark" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-black text-base">{item.name}</div>
                        <div className="text-[10px] font-black text-blue-dark/40 uppercase mb-1">{item.selectedSize || '50ml'}</div>
                        <div className="text-blue-dark/60 font-bold">
                          PKR {Number(item.price).toLocaleString()} x {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-black text-base">PKR {(Number(item.price) * item.quantity).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                
                <div className="space-y-4 pt-8 border-t-2 border-blue">
                  <div className="flex justify-between text-blue-dark/60 font-bold">
                    <span>Subtotal</span>
                    <span>PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-blue-dark/60 font-bold">
                    <span>Delivery Fee</span>
                    <span className="text-blue-dark font-black">FREE</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-2 border-blue">
                    <span className="text-xl font-bold text-black">Total Amount</span>
                    <span className="text-3xl font-black text-black">PKR {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                form="checkout-form"
                type="submit"
                disabled={loading}
                className="w-full px-8 py-5 bg-black text-white font-bold rounded-full hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Processing...
                  </>
                ) : (
                  'Complete Order 🎉'
                )}
              </button>
              <p className="text-center text-xs text-blue-dark/40 mt-6 font-medium">
                By clicking "Complete Order", you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
