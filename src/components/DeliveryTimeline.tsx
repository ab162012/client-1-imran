import React from 'react';
import { Truck, Clock, CheckCircle, Package, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export const DeliveryTimeline = () => {
  const steps = [
    { 
      icon: CheckCircle, 
      title: "Order Placed", 
      desc: "We receive your order instantly.",
      color: "bg-green-500",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      lightColor: "bg-green-50"
    },
    { 
      icon: Package, 
      title: "Processing", 
      desc: "Carefully packed in 1-2 days.",
      color: "bg-orange-500",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
      lightColor: "bg-orange-50"
    },
    { 
      icon: Truck, 
      title: "On the Way", 
      desc: "Shipped via premium courier.",
      color: "bg-indigo-500",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200",
      lightColor: "bg-indigo-50"
    },
    { 
      icon: MapPin, 
      title: "Delivered", 
      desc: "Arrives in 3-6 business days.",
      color: "bg-pink-500",
      textColor: "text-pink-700",
      borderColor: "border-pink-200",
      lightColor: "bg-pink-50"
    }
  ];

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-black tracking-tight">Track Your Scent 🚚</h2>
        <p className="text-blue-dark/60 font-medium mb-16 max-w-2xl mx-auto">From our enclave to your doorstep, every step is handled with care.</p>
        
        <div className="relative">
          {/* Horizontal Line for Desktop */}
          <div className="hidden md:block absolute top-[40px] left-0 w-full h-1 bg-gray-100 z-0 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-green-500 via-indigo-500 to-pink-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center group"
              >
                <div className={`w-20 h-20 rounded-full ${step.color} text-white flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform duration-300 relative z-20`}>
                  <step.icon size={32} />
                  <div className={`absolute -inset-2 rounded-full border-2 ${step.borderColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse`} />
                </div>
                
                <div className={`${step.lightColor} p-6 rounded-3xl border-2 ${step.borderColor} shadow-sm group-hover:shadow-md transition-all duration-300 w-full`}>
                  <h3 className={`font-bold text-lg sm:text-xl mb-2 ${step.textColor}`}>{step.title}</h3>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
