import React, { useEffect, useState, useCallback } from 'react';
import { Product, Review } from '../types';
import { ProductCard } from './Common';
import { ProductService } from '../services/ProductService';
import { supabase } from '../supabase';

interface ProductsListProps {
  featuredOnly?: boolean;
}

export const ProductsList: React.FC<ProductsListProps> = ({ featuredOnly = false }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const categories = ['All', 'Men', 'Unisex'];

  const processProducts = useCallback((data: Product[]) => {
    return data.map(item => {
      const name = item.name?.toLowerCase() || '';
      let category = 'Men';
      if (name.includes('baqarat') || name.includes('aruj')) {
        category = 'Unisex';
      }
      return { ...item, category };
    });
  }, []);

  const fetchInitialProducts = async () => {
    try {
      setLoading(true);
      
      // Get total count
      const count = await ProductService.getProductCount();
      setTotalCount(count);

      // Fetch first page
      const result = await ProductService.getProductsPaginated(20, 0);
      const processed = processProducts(result.products);
      
      setProducts(featuredOnly ? processed.filter(p => p.featured) : processed);
      setCurrentPage(result.nextPage || 0);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const result = await ProductService.getProductsPaginated(20, currentPage);
      const processed = processProducts(result.products);
      
      setProducts(prev => [...prev, ...(featuredOnly ? processed.filter(p => p.featured) : processed)]);
      setCurrentPage(result.nextPage || currentPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialProducts();

    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved');
      
      if (!error && data) {
        setReviews(data as Review[]);
      }
    };
    fetchReviews();

    // Supabase Realtime for reviews (optional but nice)
    const channel = supabase
      .channel('reviews-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [featuredOnly]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-8">
      {!featuredOnly && (
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex flex-wrap justify-center gap-4">
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
          {totalCount !== null && (
            <p className="text-xs font-bold text-blue-dark/40 uppercase tracking-widest">
              Showing {products.length} of {totalCount} products
            </p>
          )}
        </div>
      )}
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-blue-dark/60 font-bold bg-blue-light rounded-3xl border-2 border-blue p-8">
          <p className="text-xl mb-2 text-black">No products available yet 🛍️</p>
          <p className="text-sm">Check back soon for our premium collection.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-12 max-w-4xl mx-auto">
            {filteredProducts.map((product) => {
              const productReviews = reviews.filter(r => r.productId === product.id && r.status === 'approved');
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

          {hasMore && !featuredOnly && (
            <div className="flex justify-center pt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-10 py-4 bg-white text-black font-bold rounded-full border-2 border-blue hover:border-black transition-all shadow-lg disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Products'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
