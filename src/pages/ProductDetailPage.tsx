import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Product, Review } from '../types';
import { useCart } from '../hooks/useCart';
import { Minus, Plus, ShoppingBag, ArrowLeft, ShieldCheck, Zap, Eye, Star, TrendingUp, Heart, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { ProductCard } from '../components/Common';
import { DeliveryTimeline } from '../components/DeliveryTimeline';
import { ProductService } from '../services/ProductService';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<'30ml' | '50ml' | '100ml'>('50ml');
  const [viewers, setViewers] = useState(12);
  const [boughtCount, setBoughtCount] = useState(48);
  const [recentPurchase, setRecentPurchase] = useState<{ name: string, city: string } | null>(null);
  const [bundles, setBundles] = useState<Product[]>([]);
  
  // Image Gallery State
  const [mainImage, setMainImage] = useState<string | null>(null);

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    // Simulate random viewers and purchases for urgency
    setViewers(Math.floor(Math.random() * 15) + 8);
    setBoughtCount(Math.floor(Math.random() * 50) + 30);
    window.scrollTo(0, 0);

    if (!id) return;

    const fetchProductData = async () => {
      try {
        setLoading(true);
        const { data: foundProduct, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && foundProduct) {
          setProduct(foundProduct as Product);
          setMainImage(foundProduct.image);
          
          // Set Bundles (Featured products)
          const { data: featured } = await supabase
            .from('products')
            .select('*')
            .eq('featured', true)
            .neq('id', id)
            .limit(2);
          setBundles(featured as Product[] || []);

          // Increment views
          await supabase.from('products').update({ views: (foundProduct.views || 0) + 1 }).eq('id', id);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error loading product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();

    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .eq('status', 'approved');
      
      if (!error && data) {
        setReviews(data as Review[]);
      }
    };
    fetchReviews();

    const channel = supabase
      .channel(`reviews-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `product_id=eq.${id}` }, fetchReviews)
      .subscribe();

    // Simulate Recent Purchase Notification
    const cities = ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Peshawar'];
    const names = ['Ahmed', 'Sara', 'Zain', 'Fatima', 'Omar', 'Ayesha', 'Bilal', 'Hina'];
    
    const showNotification = () => {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      setRecentPurchase({ name, city });
      setTimeout(() => setRecentPurchase(null), 5000);
    };

    const notificationInterval = setInterval(() => {
      if (Math.random() > 0.7) showNotification();
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(notificationInterval);
    };
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newReview.name || !newReview.comment) return;
    
    setReviewSubmitting(true);
    try {
      const reviewId = Math.random().toString(36).substring(2, 15);
      const { error } = await supabase.from('reviews').insert({
        id: reviewId,
        product_id: id,
        customer_name: newReview.name,
        rating: newReview.rating,
        comment: newReview.comment,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      if (error) throw error;

      setReviewSuccess(true);
      setNewReview({ name: '', rating: 5, comment: '' });
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-40 flex justify-center bg-white min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 pb-20 text-center text-black bg-white min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Link to="/shop" className="text-blue-dark hover:underline font-bold">Back to Shop</Link>
      </div>
    );
  }

  const savings = product.original_price ? product.original_price - product.price : 0;
  
  const currentPrice = product.sizePrices?.[selectedSize] || product.price;
  
  // Combine single image and images array for gallery
  const allImages = product.images?.length ? product.images : [product.image];

  return (
    <div className="pt-24 md:pt-32 pb-24 bg-white min-h-screen relative overflow-hidden">
      {/* Sticky Mobile Add to Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t-2 border-blue p-4 z-50 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-blue-dark/80 uppercase tracking-widest">Price ({selectedSize})</span>
          <span className="text-xl font-black text-black">PKR {currentPrice.toLocaleString()}</span>
        </div>
        <button
          onClick={() => addToCart(product, quantity, selectedSize)}
          className="bg-black text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-blue transition-all active:scale-95 flex items-center gap-2"
        >
          <ShoppingBag size={18} />
          Add to Cart
        </button>
      </div>

      {/* Recent Purchase Notification */}
      {recentPurchase && (
        <div
          className="fixed bottom-8 left-0 z-50 bg-blue-light text-black p-4 rounded-2xl shadow-2xl border-2 border-blue flex items-center space-x-4 max-w-xs"
        >
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="text-white" size={20} />
          </div>
          <div className="text-sm">
            <p className="font-bold">{recentPurchase.name} from {recentPurchase.city}</p>
            <p className="text-blue-dark/60 font-medium">just purchased this scent! ✨</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-dark/60 hover:text-black transition-colors mb-6 md:mb-10 group font-bold uppercase tracking-widest text-[10px] md:text-xs"
        >
          <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Collection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 items-start">
          {/* TOP SECTION: Left - Image Gallery */}
          <div className="space-y-6">
            <div
              className="aspect-[4/5] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-blue-light border-2 border-blue shadow-2xl relative flex items-center justify-center group"
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ShoppingBag className="text-blue-dark" size={120} />
              )}
              
              {/* Floating Badges */}
              <div className="absolute top-4 left-4 right-4 md:top-8 md:left-8 md:right-8 flex justify-between items-start z-10 pointer-events-none">
                {/* Custom Badge */}
                <div>
                  {(product.badge || 'Premium Edition') && (
                    <div className="bg-black text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-xl pointer-events-auto">
                      {product.badge || 'Premium Edition'}
                    </div>
                  )}
                </div>

                {/* Stock Status Badge */}
                <div className="flex flex-col items-end gap-2">
                  {product.stockStatus === 'Out of Stock' && (
                    <div className="bg-black text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-xl pointer-events-auto">
                      Out of Stock
                    </div>
                  )}
                  {product.stockStatus === 'Limited' && (
                    <div className="bg-blue-dark text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-xl pointer-events-auto">
                      Limited Stock
                    </div>
                  )}
                  {product.stockStatus === 'In Stock' && (
                    <div className="bg-green-600 text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-xl pointer-events-auto">
                      In Stock
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setMainImage(img)}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${mainImage === img ? 'border-blue-dark scale-105 shadow-lg shadow-blue/30' : 'border-blue opacity-50 hover:opacity-100 hover:border-blue-dark'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

            {/* TOP SECTION: Right - Info */}
          <div className="space-y-8 md:space-y-12">
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-blue-dark/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                  <TrendingUp size={14} />
                  <span>{product.category || 'Trending Fragrance'}</span>
                </div>
                <h1 className="text-4xl md:text-7xl font-bold text-black tracking-tighter leading-[0.9]">{product.name}</h1>
              </div>
              
              {/* Average Rating Display */}
              {reviews.length > 0 && (
                <div className="flex items-center space-x-3 bg-blue-light w-fit px-4 py-2 rounded-full border-2 border-blue">
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length) ? "currentColor" : "none"} 
                        className={i < Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length) ? "" : "text-blue-dark/20"}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-black font-bold">
                    {(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)} <span className="text-blue-dark/80 font-medium ml-1">({reviews.length} Reviews)</span>
                  </span>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                <div className="flex items-end space-x-4">
                  <span className="text-5xl md:text-7xl text-black font-black tracking-tighter">PKR {currentPrice.toLocaleString()}</span>
                  {product.original_price && (
                    <span className="text-2xl md:text-3xl text-blue-dark/40 font-bold line-through mb-1">
                      PKR {product.original_price.toLocaleString()}
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <div className="bg-blue-dark text-white px-4 py-1.5 rounded-lg font-black text-[10px] md:text-xs w-fit uppercase tracking-widest animate-pulse">
                    🔥 Special Savings: PKR {savings.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* SIZE SELECTION */}
            <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-blue-dark/60">Select Size</label>
              <div className="flex gap-4">
                {(['30ml', '50ml', '100ml'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${
                      selectedSize === size
                        ? 'bg-black text-white border-black shadow-xl scale-105'
                        : 'bg-white text-black border-blue hover:border-black'
                    }`}
                  >
                    <div className="text-sm">{size}</div>
                    <div className="text-[10px] opacity-60">
                      PKR {(product.sizePrices?.[size] || product.price).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION SECTION */}
            <div className="pt-2 flex flex-col space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center border-2 border-blue rounded-full p-1 bg-white shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 md:p-4 text-blue-dark/40 hover:text-black transition-colors"
                  >
                    <Minus size={20} md:size={24} />
                  </button>
                  <span className="w-10 md:w-14 text-center font-black text-xl md:text-2xl text-black">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 md:p-4 text-blue-dark/40 hover:text-black transition-colors"
                  >
                    <Plus size={20} md:size={24} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    addToCart(product, quantity, selectedSize);
                  }}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center px-10 py-5 md:py-6 border-2 border-transparent bg-black text-white font-black text-lg md:text-xl rounded-full hover:bg-blue hover:text-white hover:border-black transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
                >
                  Add to Cart 🛒
                </button>
              </div>
              
              <button
                onClick={() => {
                  addToCart(product, quantity, selectedSize);
                  navigate('/checkout');
                }}
                className="w-full flex items-center justify-center px-10 py-5 md:py-6 bg-blue-dark text-white font-black text-xl md:text-2xl rounded-full hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
              >
                Buy It Now 🚀
              </button>
            </div>

            {/* URGENCY & SOCIAL PROOF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center text-black font-bold text-sm bg-blue-light border-2 border-blue px-6 py-4 rounded-3xl">
                <Zap size={20} className="mr-4 text-blue-dark" />
                <div>
                  <p>Only {product.stock || 5} left!</p>
                  <p className="text-[10px] text-blue-dark/60 uppercase tracking-widest mt-0.5">Selling out fast</p>
                </div>
              </div>
              <div className="flex items-center text-black font-bold text-sm bg-blue-light border-2 border-blue px-6 py-4 rounded-3xl">
                <Eye size={20} className="mr-4 text-blue-dark" />
                <div>
                  <p>{viewers} viewing now</p>
                  <p className="text-[10px] text-blue-dark/60 uppercase tracking-widest mt-0.5">High demand item</p>
                </div>
              </div>
              <div className="flex items-center text-black font-bold text-sm bg-blue-light border-2 border-blue px-6 py-4 rounded-3xl sm:col-span-2">
                <Heart size={20} className="mr-4 text-blue-dark" />
                <div>
                  <p>{boughtCount} people bought this in the last 24 hours</p>
                  <p className="text-[10px] text-blue-dark/60 uppercase tracking-widest mt-0.5">Verified social proof</p>
                </div>
              </div>
            <DeliveryTimeline />
          </div>
        </div>     </div>

        {/* BUNDLES SECTION (Frequently Bought Together) */}
        {bundles.length > 0 && (
          <div className="mt-32 pt-16 border-t-2 border-blue">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-dark/40 mb-4">Complete the Set</h2>
                <h3 className="text-4xl md:text-5xl font-bold text-black tracking-tighter">Frequently Bought Together</h3>
              </div>
              <div className="bg-black text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest">
                Bundle & Save 10%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {bundles.map(bundleProduct => (
                <div key={bundleProduct.id} className="bg-blue-light border-2 border-blue rounded-[3rem] p-8 flex flex-col sm:flex-row items-center gap-8 group hover:border-blue-dark transition-all">
                  <div className="w-40 h-40 bg-white rounded-[2rem] overflow-hidden flex-shrink-0 border-2 border-blue">
                    <img src={bundleProduct.image} alt={bundleProduct.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-2xl font-bold text-black mb-2">{bundleProduct.name}</h4>
                    <p className="text-blue-dark/70 text-sm mb-6 line-clamp-2 font-medium">{bundleProduct.description}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-4 mb-6">
                      <span className="text-2xl font-black text-black">PKR {bundleProduct.price.toLocaleString()}</span>
                      {bundleProduct.original_price && (
                        <span className="text-lg text-blue-dark/40 line-through font-bold">PKR {bundleProduct.original_price.toLocaleString()}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart(bundleProduct, 1)}
                      className="w-full sm:w-auto px-8 py-3 bg-black text-white font-black rounded-full hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all text-sm uppercase tracking-widest"
                    >
                      Add Bundle Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS SECTION */}
        <div className="mt-32 pt-16 border-t-2 border-blue">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-12">
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-dark/40">Voice of Customers</h2>
                <h3 className="text-4xl font-bold text-black tracking-tighter">Real Reviews from Real People</h3>
              </div>
              
              {reviews.length === 0 ? (
                <div className="bg-blue-light p-12 rounded-[3rem] border-2 border-blue text-center">
                  <p className="text-blue-dark/60 italic font-bold text-lg">No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-blue-light p-8 rounded-[2.5rem] border-2 border-blue hover:border-blue-dark transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                          <span className="font-black text-black text-lg">{review.customerName}</span>
                          <span className="text-[10px] text-blue-dark/60 font-bold uppercase flex items-center mt-1 tracking-widest">
                            <ShieldCheck size={12} className="mr-1 text-blue-dark" /> Verified Purchase
                          </span>
                        </div>
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-blue-dark/20"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-blue-dark/80 leading-relaxed italic font-medium">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review Form */}
            <div className="bg-blue-light text-black p-10 rounded-[3rem] shadow-2xl h-fit sticky top-32 border-2 border-blue">
              <h3 className="text-2xl font-black mb-8 tracking-tighter">Share Your Experience</h3>
              
              {reviewSuccess ? (
                <div className="bg-blue-dark text-white p-6 rounded-2xl text-center font-bold">
                  ✨ Thank you! Your review is pending approval.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-blue-dark/60 mb-2">Your Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-4 border-2 border-blue bg-white text-black rounded-2xl focus:border-black outline-none font-bold transition-all"
                      value={newReview.name || ''}
                      onChange={e => setNewReview({...newReview, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-blue-dark/60 mb-2">Rating</label>
                    <select 
                      className="w-full p-4 border-2 border-blue bg-white text-black rounded-2xl focus:border-black outline-none font-bold transition-all appearance-none"
                      value={newReview.rating || 5}
                      onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}
                    >
                      <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                      <option value="4">⭐⭐⭐⭐ Good</option>
                      <option value="3">⭐⭐⭐ Average</option>
                      <option value="2">⭐⭐ Poor</option>
                      <option value="1">⭐ Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-blue-dark/60 mb-2">Your Review</label>
                    <textarea 
                      required
                      rows={4}
                      className="w-full p-4 border-2 border-blue bg-white text-black rounded-2xl focus:border-black outline-none font-bold transition-all"
                      value={newReview.comment || ''}
                      onChange={e => setNewReview({...newReview, comment: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={reviewSubmitting}
                    className="w-full py-5 bg-black text-white font-black rounded-full hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest text-sm"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Post Review ✨'}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        {/* OPTIONAL ADD: You may also like */}
        {/* We can implement a "You may also like" section by fetching other products from Firestore if needed */}

      </div>
    </div>
  );
};
