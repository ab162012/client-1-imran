import { supabase } from './lib/supabase';
import { PRODUCTS } from './constants';

export const seedProducts = async () => {
  try {
    console.log('Syncing products to Supabase...');
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(PRODUCTS, { onConflict: 'id' });
    
    if (upsertError) throw upsertError;
    console.log('Products synced successfully.');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
};
