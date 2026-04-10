import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

export const Success = () => {
  return (
    <div className="pt-48 pb-24 text-center px-4 bg-white min-h-screen">
      <div className="mb-8 flex justify-center relative">
        <div className="w-24 h-24 bg-blue-light rounded-full flex items-center justify-center text-blue-dark shadow-lg border-2 border-blue relative z-10">
          <CheckCircle2 size={64} />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 tracking-tighter">
        Order placed successfully 🎉
      </h1>
      <p className="text-lg text-blue-dark/70 font-medium max-w-md mx-auto mb-12 leading-relaxed">
        Thank you for your purchase! Your luxury fragrance is being prepared for shipment. Our team has been notified at <span className="text-blue-dark font-bold">infoperfumeenclave@gmail.com</span> and will process your order shortly.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
        <Link
          to="/shop"
          className="w-full sm:w-auto flex items-center justify-center px-10 py-4 bg-black text-white font-bold rounded-full hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl"
        >
          <ShoppingBag size={20} className="mr-2" />
          Continue Shopping
        </Link>
        <Link
          to="/"
          className="w-full sm:w-auto flex items-center justify-center px-10 py-4 border-2 border-blue bg-white text-black font-bold rounded-full hover:bg-blue-light transition-all"
        >
          Back to Home
          <ArrowRight size={20} className="ml-2" />
        </Link>
      </div>
    </div>
  );
};
