import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Package, MapPin, Phone, User, Calendar, CreditCard } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const Success = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'orders', orderId));
          if (docSnap.exists()) {
            setOrder({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (error) {
          console.error("Error fetching order:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  return (
    <div className="pt-32 pb-24 bg-blue-light/30 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-[3rem] border-2 border-blue shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-light p-8 text-center border-b-2 border-blue">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-green-500 shadow-lg border-2 border-blue animate-bounce">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-black mb-2 tracking-tighter">
              Order Placed Successfully! 🎉
            </h1>
            <p className="text-blue-dark/70 font-bold">
              Thank you for choosing Perfume Enclave.
            </p>
          </div>

          <div className="p-8 space-y-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
            ) : order ? (
              <>
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-blue-dark/40 uppercase tracking-widest flex items-center">
                      <User size={16} className="mr-2" /> Customer Details
                    </h3>
                    <div className="space-y-2 bg-blue-light/50 p-4 rounded-2xl border-2 border-blue/30">
                      <p className="font-bold text-black">{order.customer?.name}</p>
                      <p className="text-sm text-blue-dark/70 font-medium flex items-center">
                        <Phone size={14} className="mr-2" /> {order.customer?.phone}
                      </p>
                      <p className="text-sm text-blue-dark/70 font-medium flex items-center">
                        <MapPin size={14} className="mr-2" /> {order.customer?.address}, {order.customer?.city}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-blue-dark/40 uppercase tracking-widest flex items-center">
                      <CreditCard size={16} className="mr-2" /> Order Info
                    </h3>
                    <div className="space-y-2 bg-blue-light/50 p-4 rounded-2xl border-2 border-blue/30">
                      <p className="text-sm font-bold text-black">Order ID: <span className="font-mono text-blue-dark">{order.id.slice(0, 8)}...</span></p>
                      <p className="text-sm text-blue-dark/70 font-medium flex items-center">
                        <Calendar size={14} className="mr-2" /> {new Date(order.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-blue-dark/70 font-medium flex items-center">
                        <Package size={14} className="mr-2" /> Status: <span className="ml-1 text-green-600 font-bold uppercase text-[10px] bg-green-50 px-2 py-0.5 rounded-full border border-green-200">{order.status}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-dark/40 uppercase tracking-widest">Your Fragrances</h3>
                  <div className="border-2 border-blue rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-blue/30">
                        {order.products?.map((p: any, idx: number) => (
                          <tr key={idx} className="text-sm">
                            <td className="p-4">
                              <div className="font-bold text-black">{p.name}</div>
                              <div className="text-[10px] font-bold text-blue-dark/40 uppercase">{p.size || '50ml'}</div>
                            </td>
                            <td className="p-4 text-center font-black text-blue-dark">x{p.quantity}</td>
                            <td className="p-4 text-right font-mono font-bold text-black">PKR {(p.price * p.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-light/30 border-t-2 border-blue">
                          <td colSpan={2} className="p-4 text-right font-black text-blue-dark">Total Amount</td>
                          <td className="p-4 text-right font-mono font-black text-black text-xl">PKR {order.total?.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-blue-dark/70 font-bold mb-4">We couldn't load your order details, but don't worry! Your order has been received.</p>
                <p className="text-sm text-blue-dark/50">Our team has been notified at <span className="text-blue-dark font-bold">infoperfumeenclave@gmail.com</span></p>
              </div>
            )}

            <div className="pt-8 border-t-2 border-blue flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/shop"
                className="w-full sm:w-auto flex items-center justify-center px-10 py-4 bg-black text-white font-bold rounded-full hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl"
              >
                <ShoppingBag size={20} className="mr-2" />
                Continue Shopping
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto flex items-center justify-center px-10 py-4 border-2 border-blue bg-white text-black font-bold rounded-full hover:bg-blue-light transition-all"
              >
                Back to Home
                <ArrowRight size={20} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-blue-dark/50 text-sm font-medium">
          A confirmation email has been sent to the admin. For any queries, please contact us on WhatsApp.
        </p>
      </div>
    </div>
  );
};
