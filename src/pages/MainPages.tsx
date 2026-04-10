import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../constants';
import { ProductsList } from '../components/ProductsList';
import { ProductCard } from '../components/Common';
import { CheckCircle2, Gift, Star, MessageCircle, ShoppingBag, Truck, Clock } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { Product, Review } from '../types';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { DeliveryTimeline } from '../components/DeliveryTimeline';

export const Home = () => {
  const { settings } = useSettings();
  const [heroProduct, setHeroProduct] = useState<Product | null>(null);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved')
        .limit(2);
      
      if (error) {
        console.error("Error fetching testimonials:", error);
      } else {
        setTestimonials(data as Review[]);
      }
      setLoadingTestimonials(false);
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (!settings?.heroProductId) return;

    const fetchHeroProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', settings.heroProductId)
        .single();
      
      if (error) {
        console.error("Error fetching hero product:", error);
        setHeroProduct(null);
      } else {
        setHeroProduct(data as Product);
      }
    };
    fetchHeroProduct();
  }, [settings?.heroProductId]);

  const displayHeroName = heroProduct?.name || "Smell Different.";

  return (
    <div className="pt-20 bg-white text-black">
      {/* OFFER BANNER */}
      <div className="bg-black text-white text-center py-3 px-4 font-bold text-sm uppercase tracking-widest">
        ✨ Special Offer: Buy 5 Perfumes, Get 1 Free! ✨
      </div>

      {/* 1. PERFUME ENCLAVE COLLECTION (NOW AT TOP) */}
      <section className="py-20 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-7xl font-black text-black leading-tight mb-6 tracking-tighter uppercase">
              Perfume Enclave ⭐
            </h1>
            <p className="text-base md:text-xl text-black/70 mb-10 font-bold max-w-xl mx-auto leading-relaxed">
              Our most loved fragrances, handpicked for you. Essence of Pakistan, crafted to leave an impression.
            </p>
            <div className="w-20 h-2 bg-black mx-auto rounded-full mt-6" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.filter(p => p.featured).slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} rating={5} reviewCount={12} />
            ))}
          </div>
          <div className="text-center mt-16">
            <Link
              to="/shop"
              className="inline-flex items-center px-10 py-4 bg-black text-white font-bold text-lg rounded-full hover:bg-blue hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl border-2 border-transparent hover:border-black"
            >
              Shop Full Collection 🛒
            </Link>
          </div>
        </div>
      </section>

      <div className="lg:hidden">
        <DeliveryTimeline />
      </div>

      {/* 3. VALUE STRIP (TRUST) */}
      <section className="py-12 md:py-20 bg-gray-50 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-center">
            {[
              { icon: CheckCircle2, label: "Long Lasting" },
              { icon: CheckCircle2, label: "Premium Quality" },
              { icon: CheckCircle2, label: "Cash on Delivery" },
              { icon: CheckCircle2, label: "Free Delivery 🚚" }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="flex flex-col items-center justify-center space-y-3 p-4 bg-white rounded-2xl border-2 border-transparent hover:border-black transition-all hover:shadow-lg group"
              >
                <item.icon className="text-black group-hover:scale-110 transition-transform" size={32} />
                <span className="font-black text-black text-sm md:text-base">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SCENT QUIZ SECTION */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="bg-gray-50 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 text-center text-black shadow-2xl relative overflow-hidden border-2 border-black"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-black rounded-full blur-[100px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-black rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-6xl font-black mb-6 tracking-tighter text-black leading-none">Find Your Perfect Scent</h2>
              <p className="text-lg md:text-2xl mb-12 opacity-90 max-w-2xl mx-auto text-black font-bold leading-relaxed">
                Not sure which fragrance suits you best? Take our 30-second quiz and discover your signature scent.
              </p>
              <Link
                to="/quiz"
                className="inline-flex items-center px-10 md:px-14 py-4 md:py-5 bg-black text-white font-black text-lg rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-2xl border-2 border-transparent hover:border-black"
              >
                Start Scent Quiz ✨
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 space-y-8 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">Why Perfume Enclave?</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-sm text-black font-black text-xl">1</div>
                  <span className="text-xl font-black text-black">Crafted with premium ingredients</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-sm text-black font-black text-xl">2</div>
                  <span className="text-xl font-black text-black">50% Concentration</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-sm text-black font-black text-xl">3</div>
                  <span className="text-xl font-black text-black">Luxury experience, fair price</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-gray-50 bg-gray-50 flex items-center justify-center">
                {heroProduct ? (
                  <img
                    src={heroProduct.image}
                    alt="Premium Fragrance"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ShoppingBag className="text-black/20" size={120} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. USE CASE SECTION */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-black mb-6 tracking-tighter">Perfect For Every Occasion</h2>
            <div className="w-20 h-2 bg-black mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {[
              { emoji: "🔥", label: "Date Nights" },
              { emoji: "💼", label: "Office Wear" },
              { emoji: "🎉", label: "Events" }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-gray-50 p-10 rounded-[2.5rem] text-center border-2 border-black hover:bg-black hover:text-white transition-all hover:-translate-y-2 cursor-default group"
              >
                <div className="text-5xl mb-6 group-hover:scale-125 transition-transform">{item.emoji}</div>
                <h3 className="text-2xl font-black tracking-tight">{item.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. URGENCY SECTION */}
      <section className="py-12 bg-blue-dark text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-white">
            ⚡ Selling Fast — Limited Stock Available
          </h2>
        </div>
      </section>

      {/* 8. TESTIMONIALS (DYNAMIC) */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-black mb-4 tracking-tight">What They Say</h2>
            <div className="w-16 h-1.5 bg-black mx-auto rounded-full" />
          </div>
          
          {loadingTestimonials ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((review) => (
                <div key={review.id} className="bg-gray-50 p-8 rounded-3xl shadow-sm border-2 border-black text-center">
                  <div className="flex justify-center text-yellow-500 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} fill={i < review.rating ? "currentColor" : "none"} size={20} className={i < review.rating ? "" : "text-black/20"} />
                    ))}
                  </div>
                  <p className="text-black/80 italic mb-4 font-bold">"{review.comment}"</p>
                  <p className="font-black text-black">— {review.customerName}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-black/40 font-black">
              No reviews yet. Be the first to share your experience!
            </div>
          )}
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-32 bg-gray-50 text-center border-t-2 border-black">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-8 tracking-tight">
            Find Your Signature Scent
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center px-12 py-4 bg-black text-white font-black text-lg rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-xl border-2 border-transparent hover:border-black"
          >
            Shop Now 🛒
          </Link>
        </div>
      </section>
    </div>
  );
};

export const Shop = () => {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      {/* OFFER BANNER */}
      <div className="bg-black text-white text-center py-3 px-4 font-black text-sm uppercase tracking-widest mb-12 max-w-5xl mx-auto rounded-full shadow-lg border-2 border-black">
        ✨ Special Offer: Buy 5 Perfumes, Get 1 Free! ✨
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight">Our Collection</h1>
          <div className="w-16 h-1.5 bg-black mx-auto rounded-full" />
        </div>
        <ProductsList />
      </div>
    </div>
  );
};

export const Contact = () => {
  const { settings } = useSettings();
  
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 tracking-tight">Contact Us</h1>
          <div className="w-16 h-1 bg-blue mx-auto rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-gray-50 p-8 rounded-3xl border-2 border-black shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-black">Get in Touch</h2>
            <p className="text-black/70 font-bold">Have questions about our fragrances or your order? We're here to help!</p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center text-black">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className="font-black text-black">WhatsApp Us</p>
                  <p className="text-black font-bold">+92 305 8678521</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center text-black">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="font-black text-black">Email Us</p>
                  <p className="text-black font-bold">infoperfumeenclave@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <form className="bg-gray-50 p-8 rounded-3xl border-2 border-black shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-black text-black mb-1">Name</label>
              <input type="text" className="w-full p-3 border-2 border-black bg-white text-black rounded-xl focus:ring-2 focus:ring-black outline-none font-bold" placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-1">Email</label>
              <input type="email" className="w-full p-3 border-2 border-black bg-white text-black rounded-xl focus:ring-2 focus:ring-black outline-none font-bold" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-1">Message</label>
              <textarea rows={4} className="w-full p-3 border-2 border-black bg-white text-black rounded-xl focus:ring-2 focus:ring-black outline-none font-bold" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" className="w-full py-3 bg-black text-white font-black rounded-xl hover:bg-gray-800 border-2 border-transparent hover:border-black transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
