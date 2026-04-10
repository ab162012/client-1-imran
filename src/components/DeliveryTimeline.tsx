import React from 'react';
import { Truck, Clock, CheckCircle } from 'lucide-react';

export const DeliveryTimeline = () => {
  return (
    <section className="py-8 sm:py-16 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-8 sm:mb-12 text-black uppercase tracking-tight">Our Delivery Process 🚚</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          {[
            { icon: CheckCircle, title: "Order Placed", desc: "We receive your order instantly." },
            { icon: Clock, title: "Processing (1-2 Days)", desc: "We carefully pack your fragrance." },
            { icon: Truck, title: "Delivery (3-6 Days)", desc: "Your scent arrives at your doorstep." }
          ].map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-4 sm:p-6 bg-gray-50 rounded-3xl border-2 border-black hover:bg-black hover:text-white transition-all group">
              <div className="sm:hidden">
                <step.icon className="text-black group-hover:text-white mb-3" size={32} />
              </div>
              <div className="hidden sm:block">
                <step.icon className="text-black group-hover:text-white mb-4" size={48} />
              </div>
              <h3 className="font-black text-lg sm:text-xl mb-1 sm:mb-2">{step.title}</h3>
              <p className="text-sm sm:text-base font-bold opacity-80">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
