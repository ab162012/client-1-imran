import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Review } from '../types';
import { ProductCard } from './Common';

interface ProductsListProps {
  featuredOnly?: boolean;
}

export const ProductsList: React.FC<ProductsListProps> = ({ featuredOnly = false }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Men', 'Unisex'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch products
      let query = supabase.from('products').select('*');
      
      if (featuredOnly) {
        query = query.eq('featured', true);
      }
      
      const { data: productsData, error: productsError } = await query;
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        // Filter out women's products
        const filteredProducts = (productsData as Product[]).filter(p => p.category?.toLowerCase() !== 'women');
        setProducts(filteredProducts);
      }

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase.from('reviews').select('*').eq('status', 'approved');
      
      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      } else {
        setReviews(reviewsData as Review[]);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [featuredOnly]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-blue-dark/60 font-bold bg-blue-light rounded-3xl border-2 border-blue p-8">
        <p className="text-xl mb-2 text-black">No products available yet 🛍️</p>
        <p className="text-sm">Check back soon for our premium collection.</p>
      </div>
    );
  }

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-8">
      {!featuredOnly && (
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest border-2 transition-all ${
                selectedCategory === cat 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-black border-blue hover:border-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        {filteredProducts.map((product) => {
          const productReviews = reviews.filter(r => r.productId === product.id);
          const avgRating = productReviews.length > 0 
            ? productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length 
            : 0;
          
          return (
            <ProductCard 
              key={product.id} 
              product={product} 
              rating={avgRating} 
              reviewCount={productReviews.length} 
            />
          );
        })}
      </div>
    </div>
  );
};
