import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { Lock, Star, ShoppingBag, Music } from 'lucide-react';

export const ProductCard: React.FC<{ product: Product, rating?: number, reviewCount?: number }> = ({ product, rating = 0, reviewCount = 0 }) => {
  const savings = product.original_price ? product.original_price - product.price : 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-3xl overflow-hidden border-2 border-blue transition-all hover:shadow-xl hover:shadow-blue/30 flex flex-col relative"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
        {/* Custom Badge (e.g., "New", "Sale") */}
        <div>
          {product.badge && (
            <div className="bg-black text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-md pointer-events-auto">
              {product.badge}
            </div>
          )}
        </div>

        {/* Stock Status Badge */}
        <div className="flex flex-col items-end gap-2">
        </div>
      </div>
      <div className="block relative aspect-[4/5] overflow-hidden bg-blue-light flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-blue-dark p-4 text-center">
            <ShoppingBag size={48} className="mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest">Image not available</span>
          </div>
        )}
      </div>
      <div className="p-3 md:p-6 flex flex-col flex-grow text-center items-center">
        {product.category && (
          <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-blue-dark/60 mb-1 md:mb-2">
            {product.category}
          </div>
        )}
        <div className="flex items-center space-x-1 mb-1 md:mb-2">
          <div className="flex text-yellow-500">
            <Star size={10} className="md:w-[14px] md:h-[14px]" fill={rating >= 1 ? "currentColor" : "none"} />
            <Star size={10} className="md:w-[14px] md:h-[14px]" fill={rating >= 2 ? "currentColor" : "none"} />
            <Star size={10} className="md:w-[14px] md:h-[14px]" fill={rating >= 3 ? "currentColor" : "none"} />
            <Star size={10} className="md:w-[14px] md:h-[14px]" fill={rating >= 4 ? "currentColor" : "none"} />
            <Star size={10} className="md:w-[14px] md:h-[14px]" fill={rating >= 5 ? "currentColor" : "none"} />
          </div>
          <span className="text-[10px] md:text-xs text-blue-dark/60 font-bold">
            {rating > 0 ? `${rating.toFixed(1)}` : '0'}
          </span>
        </div>
        <h3 className="text-sm md:text-2xl font-bold text-black mb-1 md:mb-2 line-clamp-1">
          {product.name}
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-center md:space-x-3 mb-1 md:mb-2">
          <span className="text-sm md:text-xl font-bold text-black">PKR {product.price.toLocaleString()}</span>
          {product.original_price && (
            <span className="text-xs md:text-lg font-bold text-blue-dark/40 line-through">
              PKR {product.original_price.toLocaleString()}
            </span>
          )}
        </div>
        {savings > 0 && (
          <div className="bg-blue-dark text-white font-bold text-[8px] md:text-xs mb-3 md:mb-6 px-2 md:px-4 py-1 md:py-1.5 rounded-full uppercase tracking-widest">
            Save PKR {savings.toLocaleString()}
          </div>
        )}
        <div className="mt-auto w-full">
          <div
            className="group/btn block w-full py-2 md:py-3.5 font-bold rounded-full transition-all border-2 relative overflow-hidden text-xs md:text-base bg-black text-white border-transparent hover:bg-blue hover:text-white hover:border-black active:scale-95"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              View Product
              <span
                className="hidden group-hover/btn:inline-block"
              >
                →
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const Footer = () => {
  const { settings } = useSettings();

  return (
    <footer className="bg-white border-t-2 border-blue py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm font-bold uppercase tracking-widest">
            <Link to="/" className="text-blue-dark/60 hover:text-black transition-colors">Home</Link>
            <Link to="/shop" className="text-blue-dark/60 hover:text-black transition-colors">Shop</Link>
            <Link to="/contact" className="text-blue-dark/60 hover:text-black transition-colors">Contact</Link>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-blue-dark/60 font-medium max-w-md">
              {settings?.footerText || `© ${new Date().getFullYear()} Perfume Enclave. All rights reserved.`}
            </p>
            <Link to="/admin-login" className="text-blue-dark/40 hover:text-black transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest" title="Admin Access">
              <Lock size={10} /> Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
