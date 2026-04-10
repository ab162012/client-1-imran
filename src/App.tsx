/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './hooks/useCart';
import { SettingsProvider } from './contexts/SettingsContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Common';
import { Home, Shop, Contact } from './pages/MainPages';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { Quiz } from './pages/Quiz';
import { Checkout } from './pages/Checkout';
import { Success } from './pages/Success';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { MessageCircle } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;
  
  if (!isAuthenticated) return <Navigate to="/admin-login" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <SettingsProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-black">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/success" element={<Success />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            
            {/* WhatsApp Floating Button */}
            <a
              href="https://wa.me/923058678521"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all hover:scale-110"
            >
              <MessageCircle size={32} />
            </a>
          </div>
        </Router>
      </CartProvider>
    </SettingsProvider>
  );
}
