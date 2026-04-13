import React, { useEffect, useState, useCallback } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Product, Review } from '../types';
import { ProductCard } from './Common';
import { ProductService } from '../services/ProductService';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

interface ProductsListProps {
  featuredOnly?: boolean;
}

export const ProductsList: React.FC<ProductsListProps> = ({ featuredOnly = false }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const categories = ['All', 'Men', 'Unisex'];
  const PAGE_SIZE = 20;

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

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Aggregation: Get total count in 1 read
      const count = await ProductService.getTotalCount();
      setTotalCount(count);

      // 2. Pagination: Load first page
      const { products: initialProducts, lastDoc: nextDoc } = await ProductService.getProductsPaginated(PAGE_SIZE);
      
      const processed = processProducts(initialProducts);
      setProducts(featuredOnly ? processed.filter(p => p.featured) : processed);
      setLastDoc(nextDoc);
      setHasMore(initialProducts.length === PAGE_SIZE);

      // 3. SWR: Background update for the first page
      ProductService.getProductsSWR((freshData) => {
        const freshProcessed = processProducts(freshData);
        setProducts(prev => {
          // Only update if we are on the first page and not filtered by pagination
          if (lastDoc === null) {
            return featuredOnly ? freshProcessed.filter(p => p.featured) : freshProcessed;
          }
          return prev;
        });
      });

    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }, [featuredOnly, processProducts]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const { products: nextProducts, lastDoc: nextDoc } = await ProductService.getProductsPaginated(PAGE_SIZE, lastDoc);
      
      const processed = processProducts(nextProducts);
      setProducts(prev => [...prev, ...(featuredOnly ? processed.filter(p => p.featured) : processed)]);
      setLastDoc(nextDoc);
      setHasMore(nextProducts.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => unsubReviews();
  }, [loadInitialData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-blue" size={48} />
        <p className="text-blue-dark/60 font-bold animate-pulse">Loading Collection...</p>
      </div>
    );
  }

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-8">
      {!featuredOnly && (
        <div className="flex flex-col items-center space-y-6">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest border-2 transition-all ${
                  selectedCategory === cat 
                    ? 'bg-black text-white border-black shadow-lg scale-105' 
                    : 'bg-white text-black border-blue hover:border-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-xs font-black text-blue-dark/40 uppercase tracking-[0.2em]">
            Showing {filteredProducts.length} of {totalCount} Products
          </p>
        </div>
      )}
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-blue-dark/60 font-bold bg-blue-light rounded-[2.5rem] border-2 border-blue p-8">
          <p className="text-2xl mb-2 text-black">No products found 🛍️</p>
          <p className="text-sm">Try another category or check back later.</p>
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
            <div className="flex justify-center pt-12">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="group flex items-center space-x-2 px-10 py-4 bg-white border-2 border-blue text-black font-bold rounded-full hover:bg-blue hover:text-white transition-all shadow-xl disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>Load More Products</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
