import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { Lock, Star, ShoppingBag, Music } from 'lucide-react';

export const ProductCard: React.FC<{ product: Product, rating?: number, reviewCount?: number }> = ({ product, rating = 0, reviewCount = 0 }) => {
  const savings = product.original_price ? product.original_price - product.price : 0;

  return (
    <div
      className="group bg-white rounded-3xl overflow-hidden border-2 border-black transition-all hover:shadow-xl hover:shadow-black/10 flex flex-col relative"
    >
      {product.badge && (
        <div className="absolute top-4 left-4 bg-black text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full z-10 shadow-md">
          {product.badge}
        </div>
      )}
      {product.stockStatus === 'Out of Stock' && (
        <div className="absolute top-4 right-4 bg-black text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-md">
          Out of Stock
        </div>
      )}
      {product.stockStatus === 'Limited' && (
        <div className="absolute top-4 right-4 bg-blue-dark text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-md">
          Limited Stock
        </div>
      )}
      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-50 flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 ${product.stockStatus === 'Out of Stock' ? 'opacity-50 grayscale' : ''}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-blue-dark p-4 text-center">
            <ShoppingBag size={48} className="mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest">Image not available</span>
          </div>
        )}
      </Link>
      <div className="p-6 flex flex-col flex-grow text-center items-center">
        {product.category && (
          <div className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">
            {product.category}
          </div>
        )}
        <div className="flex items-center space-x-1 mb-2">
          <div className="flex text-yellow-500">
            <Star size={14} fill={rating >= 1 ? "currentColor" : "none"} />
            <Star size={14} fill={rating >= 2 ? "currentColor" : "none"} />
            <Star size={14} fill={rating >= 3 ? "currentColor" : "none"} />
            <Star size={14} fill={rating >= 4 ? "currentColor" : "none"} />
            <Star size={14} fill={rating >= 5 ? "currentColor" : "none"} />
          </div>
          <span className="text-xs text-black/60 font-black">
            {rating > 0 ? `${rating.toFixed(1)} (${reviewCount})` : 'No reviews'}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-black mb-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-center space-x-3 mb-2">
          <span className="text-xl font-bold text-black">PKR {product.price.toLocaleString()}</span>
          {product.original_price && (
            <span className="text-lg font-black text-black/40 line-through">
              PKR {product.original_price.toLocaleString()}
            </span>
          )}
        </div>
        {savings > 0 && (
          <div className="bg-black text-white font-black text-xs mb-6 px-4 py-1.5 rounded-full uppercase tracking-widest">
            Save PKR {savings.toLocaleString()}
          </div>
        )}
        <div className="mt-auto w-full">
          <Link
            to={`/product/${product.id}`}
            className={`group/btn block w-full py-3.5 font-bold rounded-full transition-all border-2 relative overflow-hidden ${product.stockStatus === 'Out of Stock' ? 'bg-gray-200 text-gray-500 border-transparent pointer-events-none' : 'bg-black text-white border-transparent hover:bg-blue hover:text-white hover:border-black active:scale-95'}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {product.stockStatus === 'Out of Stock' ? 'Sold Out' : (
                <>
                  View Product
                  <span
                    className="hidden group-hover/btn:inline-block"
                  >
                    →
                  </span>
                </>
              )}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const Footer = () => {
  const { settings } = useSettings();

  return (
    <footer className="bg-white border-t-2 border-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-widest">
            <Link to="/" className="text-black hover:underline transition-colors">Home</Link>
            <Link to="/shop" className="text-black hover:underline transition-colors">Shop</Link>
            <Link to="/contact" className="text-black hover:underline transition-colors">Contact</Link>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-black font-bold max-w-md">
              {settings?.footerText || `© ${new Date().getFullYear()} Perfume Enclave. All rights reserved.`}
            </p>
            <Link to="/admin-login" className="text-black/60 hover:text-black transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-widest" title="Admin Access">
              <Lock size={10} /> Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
