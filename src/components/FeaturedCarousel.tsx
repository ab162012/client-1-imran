import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { ProductCard } from './Common';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const FeaturedCarousel = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true);
      
      if (error) {
        console.error("Error fetching featured products:", error);
      } else {
        setProducts(data as Product[]);
      }
    };
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % products.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-white border-b-2 border-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">Featured Scents ✨</h2>
        <div className="relative overflow-hidden h-[500px] md:h-[600px] flex items-center bg-blue-light rounded-3xl border-2 border-blue">
          <button onClick={prev} className="absolute left-4 z-20 p-4 bg-white rounded-full shadow-lg border-2 border-blue text-black hover:bg-blue hover:text-white transition-colors">
            <ChevronLeft size={28} />
          </button>
          <AnimatePresence mode="wait">
            <motion.div
              key={products[currentIndex].id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex justify-center items-center"
            >
              <ProductCard product={products[currentIndex]} rating={5} reviewCount={10} />
            </motion.div>
          </AnimatePresence>
          <button onClick={next} className="absolute right-4 z-20 p-4 bg-white rounded-full shadow-lg border-2 border-blue text-black hover:bg-blue hover:text-white transition-colors">
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </section>
  );
};
