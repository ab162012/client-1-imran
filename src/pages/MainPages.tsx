import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../constants';
import { ProductsList } from '../components/ProductsList';
import { ProductCard } from '../components/Common';
import { CheckCircle2, Gift, Star, MessageSquare, ShoppingBag } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';
import { collection, query, where, limit, onSnapshot, doc } from 'firebase/firestore';
import { Product, Review } from '../types';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { DeliveryTimeline } from '../components/DeliveryTimeline';

export const Home = () => {
  const { settings } = useSettings();
  const [heroProduct, setHeroProduct] = useState<Product | null>(null);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('status', '==', 'approved'), limit(2));
    const unsub = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      setTestimonials(reviewsData);
      setLoadingTestimonials(false);
    }, (error) => {
      console.error("Error fetching testimonials:", error);
      setLoadingTestimonials(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!settings?.heroProductId) return;

    const unsubHero = onSnapshot(doc(db, 'products', settings.heroProductId), (docSnap) => {
      if (docSnap.exists()) {
        setHeroProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      } else {
        setHeroProduct(null);
      }
    }, (error) => {
      console.error("Error fetching hero product:", error);
    });

    return () => unsubHero();
  }, [settings?.heroProductId]);

  const displayHeroName = heroProduct?.name || "Smell Different.";

  return (
    <div className="pt-20 bg-white text-black">
      {/* OFFER BANNER */}
      <div className="bg-blue text-white text-center py-3 px-4 font-bold text-sm uppercase tracking-widest shadow-md">
        ✨ Special Offer: Buy 5 Perfumes, Get 1 Free! ✨
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative py-16 md:py-32 flex items-center justify-center overflow-hidden bg-white">
        {/* Background Pattern Effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1E3A8A 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl md:text-7xl font-bold text-blue-dark leading-tight mb-6 tracking-tighter inline-block pb-2 uppercase">
              <span className="font-handwriting text-5xl md:text-8xl text-blue-dark mt-4 inline-block drop-shadow-sm uppercase">perfume enclave</span>
            </h1>
            <p className="text-base md:text-xl text-blue-dark/70 mb-10 font-medium max-w-xl mx-auto leading-relaxed">
              Crafted to leave an impression. Discover our curated selection of premium fragrances that define your presence.
            </p>
            
            <Link
              to={heroProduct ? `/product/${heroProduct.id}` : "/shop"}
              className="group inline-flex items-center px-10 md:px-14 py-4 md:py-5 bg-black text-white font-bold text-lg rounded-full hover:bg-blue hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl border-2 border-transparent hover:border-black"
            >
              Shop Collection 🛒
              <span className="ml-2">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-4 tracking-tighter">Featured Products</h2>
          </div>
          <ProductsList featuredOnly={false} />
          <div className="mt-12">
            <DeliveryTimeline />
          </div>
        </div>
      </section>

      {/* 3. VALUE STRIP (TRUST) */}
      <section className="py-12 md:py-20 bg-blue-light border-b-2 border-blue">
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
                className="flex flex-col items-center justify-center space-y-3 p-4 bg-white rounded-2xl border-2 border-transparent hover:border-blue transition-all hover:shadow-lg group"
              >
                <item.icon className="text-blue-dark group-hover:scale-110 transition-transform" size={32} />
                <span className="font-bold text-black text-sm md:text-base">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SCENT QUIZ SECTION */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="bg-blue-light rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 text-center text-black shadow-2xl relative overflow-hidden border-2 border-blue"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-dark rounded-full blur-[100px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-dark rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-6xl font-bold mb-6 tracking-tighter text-black leading-none">Find Your Perfect Scent</h2>
              <p className="text-lg md:text-2xl mb-12 opacity-90 max-w-2xl mx-auto text-black font-medium leading-relaxed">
                Not sure which fragrance suits you best? Take our 30-second quiz and discover your signature scent.
              </p>
              <Link
                to="/quiz"
                className="inline-flex items-center px-10 md:px-14 py-4 md:py-5 bg-black text-white font-bold text-lg rounded-full hover:bg-blue hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl border-2 border-transparent hover:border-black"
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
              <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">Why Perfume Enclave?</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-light border-2 border-blue flex items-center justify-center shadow-sm text-black font-bold text-xl">1</div>
                  <span className="text-xl font-bold text-black">Crafted with premium ingredients</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-light border-2 border-blue flex items-center justify-center shadow-sm text-black font-bold text-xl">2</div>
                  <span className="text-xl font-bold text-black">50% Concentration</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-light border-2 border-blue flex items-center justify-center shadow-sm text-black font-bold text-xl">3</div>
                  <span className="text-xl font-bold text-black">Luxury experience, fair price</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-blue-light bg-blue-light flex items-center justify-center">
                {heroProduct ? (
                  <img
                    src={heroProduct.image}
                    alt="Premium Fragrance"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ShoppingBag className="text-blue-dark/20" size={120} />
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
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-6 tracking-tighter">Perfect For Every Occasion</h2>
            <div className="w-20 h-1.5 bg-blue mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {[
              { emoji: "🔥", label: "Date Nights" },
              { emoji: "💼", label: "Office Wear" },
              { emoji: "🎉", label: "Events" }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-blue-light p-10 rounded-[2.5rem] text-center border-2 border-blue hover:bg-blue hover:text-white transition-all hover:-translate-y-2 cursor-default group"
              >
                <div className="text-5xl mb-6 group-hover:scale-125 transition-transform">{item.emoji}</div>
                <h3 className="text-2xl font-bold tracking-tight">{item.label}</h3>
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
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4 tracking-tight">What They Say</h2>
            <div className="w-16 h-1 bg-blue mx-auto rounded-full" />
          </div>
          
          {loadingTestimonials ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((review) => (
                <div key={review.id} className="bg-blue-light p-8 rounded-3xl shadow-sm border-2 border-blue text-center">
                  <div className="flex justify-center text-yellow-500 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} fill={i < review.rating ? "currentColor" : "none"} size={20} className={i < review.rating ? "" : "text-blue-dark/20"} />
                    ))}
                  </div>
                  <p className="text-blue-dark/80 italic mb-4 font-medium">"{review.comment}"</p>
                  <p className="font-bold text-black">— {review.customerName}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-blue-dark/40 font-bold">
              No reviews yet. Be the first to share your experience!
            </div>
          )}
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-32 bg-blue-light text-center border-t-2 border-blue">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 tracking-tight">
            Find Your Signature Scent
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center px-12 py-4 bg-black text-white font-bold text-lg rounded-full hover:bg-blue hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl border-2 border-transparent hover:border-black"
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
      <div className="bg-black text-white text-center py-3 px-4 font-bold text-sm uppercase tracking-widest mb-12 max-w-5xl mx-auto rounded-full shadow-lg">
        ✨ Special Offer: Buy 5 Perfumes, Get 1 Free! ✨
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 tracking-tight">Our Collection</h1>
          <div className="w-16 h-1 bg-blue mx-auto rounded-full" />
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
          <div className="bg-blue-light p-8 rounded-3xl border-2 border-blue shadow-sm space-y-6">
            <h2 className="text-2xl font-bold text-black">Get in Touch</h2>
            <p className="text-blue-dark/70 font-medium">Have questions about our fragrances or your order? We're here to help!</p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white border-2 border-blue rounded-full flex items-center justify-center text-black">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="font-bold text-black">Email Us</p>
                  <p className="text-blue-dark/60 font-medium">infoperfumeenclave@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white border-2 border-blue rounded-full flex items-center justify-center text-black">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="font-bold text-black">Response Time</p>
                  <p className="text-blue-dark/60 font-medium">Within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
          
          <form className="bg-blue-light p-8 rounded-3xl border-2 border-blue shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Name</label>
              <input type="text" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:ring-2 focus:ring-blue-dark outline-none font-medium" placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Email</label>
              <input type="email" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:ring-2 focus:ring-blue-dark outline-none font-medium" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Message</label>
              <textarea rows={4} className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:ring-2 focus:ring-blue-dark outline-none font-medium" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
