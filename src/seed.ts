import { supabase, isSupabaseConfigured } from './supabase';
import { PRODUCTS } from './constants';

export const seedProducts = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('[Seed] Skipping seeding: Supabase is not configured.');
    return;
  }

  try {
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (!countError && count === 0) {
      console.log('Seeding products to Supabase...');
      const { error } = await supabase
        .from('products')
        .insert(PRODUCTS);
      
      if (error) throw error;
      console.log('Seeding complete.');
    }
  } catch (error) {
    console.error('Error seeding products:', error);
  }
};
