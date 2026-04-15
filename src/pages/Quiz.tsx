import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Product } from '../types';
import { STORE_ID } from '../constants';
import { ArrowRight, ArrowLeft, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/Common';

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    value: string;
    icon: string;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "What's your preferred scent intensity?",
    options: [
      { text: "Fresh & Light", value: "fresh", icon: "🌊" },
      { text: "Bold & Strong", value: "strong", icon: "🔥" }
    ]
  },
  {
    id: 2,
    text: "When do you plan to wear it most?",
    options: [
      { text: "Daytime / Office", value: "day", icon: "☀️" },
      { text: "Night / Events", value: "night", icon: "🌙" }
    ]
  },
  {
    id: 3,
    text: "What's your personality vibe?",
    options: [
      { text: "Calm & Relaxed", value: "calm", icon: "🧘" },
      { text: "Confident & Ambitious", value: "confident", icon: "💼" }
    ]
  }
];

export const Quiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendation, setRecommendation] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stores', STORE_ID, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      calculateRecommendation(newAnswers);
      setStep(questions.length);
    }
  };

  const calculateRecommendation = (finalAnswers: string[]) => {
    if (products.length === 0) return;

    // Simple matching logic
    // If they chose 'strong', 'night', 'confident' -> Recommend something bold
    // If they chose 'fresh', 'day', 'calm' -> Recommend something fresh
    
    const isStrong = finalAnswers.includes('strong');
    const isNight = finalAnswers.includes('night');
    const isConfident = finalAnswers.includes('confident');

    // Score products based on keywords in description or notes
    const scoredProducts = products.map(product => {
      let score = 0;
      const text = (product.name + ' ' + product.description + ' ' + product.notes.join(' ')).toLowerCase();
      
      if (isStrong && (text.includes('bold') || text.includes('strong') || text.includes('intense') || text.includes('command'))) score += 2;
      if (isNight && (text.includes('evening') || text.includes('night') || text.includes('formal'))) score += 2;
      if (isConfident && (text.includes('confident') || text.includes('ambitious') || text.includes('presence'))) score += 2;
      
      if (!isStrong && (text.includes('fresh') || text.includes('light') || text.includes('crisp'))) score += 2;
      if (!isNight && (text.includes('day') || text.includes('daily') || text.includes('casual'))) score += 2;
      if (!isConfident && (text.includes('calm') || text.includes('relaxed') || text.includes('ocean'))) score += 2;

      return { product, score };
    });

    scoredProducts.sort((a, b) => b.score - a.score);
    setRecommendation(scoredProducts[0].product);
  };

  const resetQuiz = () => {
    setStep(0);
    setAnswers([]);
    setRecommendation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-40 flex justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {step < questions.length ? (
          <div
            key={step}
            className="bg-black rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-white"
          >
              <div className="flex justify-between items-center mb-8">
                <span className="text-sm font-medium text-white uppercase tracking-widest">Question {step + 1} of {questions.length}</span>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-white' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-medium text-white mb-10 leading-tight">
                {questions[step].text}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {questions[step].options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className="flex items-center p-6 bg-white/5 border-2 border-transparent hover:border-white rounded-3xl transition-all group text-left"
                  >
                    <span className="text-4xl mr-6 group-hover:scale-110 transition-transform">{option.icon}</span>
                    <span className="text-xl font-medium text-white">{option.text}</span>
                    <ArrowRight className="ml-auto text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              {step > 0 && (
                <button
                  onClick={() => {
                    setStep(step - 1);
                    setAnswers(answers.slice(0, -1));
                  }}
                  className="mt-8 flex items-center text-white/60 hover:text-white transition-colors font-medium"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </button>
              )}
          </div>
        ) : (
          <div
            className="bg-black rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-white text-center"
          >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black mx-auto mb-8 shadow-lg shadow-white/20">
                <Sparkles size={40} />
              </div>
              
              <h2 className="text-3xl font-medium text-white mb-4">Your Perfect Match!</h2>
              <p className="text-white/60 mb-10">Based on your preferences, we think you'll love this fragrance.</p>

              {recommendation ? (
                <div className="max-w-sm mx-auto mb-10">
                  <ProductCard product={recommendation} />
                </div>
              ) : (
                <div className="p-10 bg-white/5 rounded-3xl border border-white mb-10">
                  <p className="text-white/80 font-medium">We couldn't find a perfect match in our current collection, but check out our full shop!</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={resetQuiz}
                  className="flex items-center justify-center px-8 py-4 border-2 border-white text-white font-medium rounded-full hover:bg-white hover:text-black transition-all"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Retake Quiz
                </button>
                <Link
                  to="/shop"
                  className="flex items-center justify-center px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-blue-light transition-all shadow-lg shadow-white/20"
                >
                  <ShoppingBag size={18} className="mr-2" />
                  Explore All
                </Link>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
