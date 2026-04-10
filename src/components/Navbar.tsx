import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { ShoppingCart } from './ShoppingCart';
import { useSettings } from '../contexts/SettingsContext';

export const Navbar = () => {
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSettings();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-40 border-b-2 border-blue shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center relative">
            {/* Hamburger Menu Button - Left */}
            <div className="flex-shrink-0 flex items-center z-10">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 text-black border-2 border-black rounded-lg hover:bg-gray-100 transition-all"
              >
                <Menu size={26} />
              </button>
            </div>

            {/* Logo Text - Center */}
            <div className="absolute left-0 right-0 flex justify-center items-center pointer-events-none">
              <Link to="/" className="flex items-center group pointer-events-auto">
                <span className="text-lg sm:text-2xl font-black tracking-widest text-black uppercase text-center">
                  Perfume Enclave
                </span>
              </Link>
            </div>

            {/* Cart Button - Right */}
            <div className="flex-shrink-0 flex items-center z-10">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-black border-2 border-black rounded-lg hover:bg-gray-100 transition-all"
              >
                <ShoppingBag size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide Menu */}
      {isMenuOpen && (
        <>
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />
          <div
            className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-white z-50 shadow-2xl flex flex-col border-r-2 border-blue"
          >
            <div className="p-6 border-b-2 border-blue flex justify-between items-center">
              <span className="text-lg font-bold tracking-widest text-black uppercase">
                Menu
              </span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-black border-2 border-blue rounded-full hover:bg-blue-light transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col space-y-4">
              {navLinks.map((link, idx) => (
                <div key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block text-lg font-bold tracking-wide uppercase transition-all p-4 rounded-2xl border-2 ${
                      location.pathname === link.path ? 'bg-blue-light border-blue text-black' : 'border-transparent text-blue-dark/60 hover:border-blue hover:text-black hover:translate-x-2'
                    }`}
                  >
                    {link.name}
                  </Link>
                </div>
              ))}
              <div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full text-lg font-bold tracking-wide uppercase text-blue-dark/60 hover:text-black hover:border-blue border-2 border-transparent p-4 rounded-2xl text-left flex items-center transition-all hover:translate-x-2"
                >
                  Cart 🛒
                  {totalItems > 0 && (
                    <span className="ml-2 bg-blue-dark text-white text-xs font-bold px-2 py-1 rounded-full">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
