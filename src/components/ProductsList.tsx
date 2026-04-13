import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Product, Review } from '../types';
import { ProductCard } from './Common';
import { ProductService } from '../services/ProductService';

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
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await ProductService.getProducts();
        
        // Apply custom categorization and filtering
        const processedProducts = productsData.map(data => {
          const name = data.name?.toLowerCase() || '';
          let category = 'Men';
          if (name.includes('baqarat') || name.includes('aruj')) {
            category = 'Unisex';
          }
          return { ...data, category };
        });

        setProducts(featuredOnly ? processedProducts.filter(p => p.featured) : processedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => {
      unsubReviews();
    };
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
    </div>
  );
};
