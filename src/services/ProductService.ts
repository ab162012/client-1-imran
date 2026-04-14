import { supabase } from '../supabase';
import { Product } from '../types';

/**
 * Helper to determine stock status based on numeric stock count
 */
const getDerivedStockStatus = (stock?: number): 'In Stock' | 'Limited' | 'Out of Stock' => {
  if (stock === undefined || stock === null) return 'In Stock';
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 5) return 'Limited';
  return 'In Stock';
};

export const ProductService = {
  /**
   * Optimized count aggregation using Supabase.
   */
  getProductCount: async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('[ProductService] Error getting count:', error);
      return 0;
    }
  },

  /**
   * Fetches products using Supabase.
   * Implements automated stock status logic.
   */
  getProducts: async (onUpdate?: (products: Product[]) => void): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;

      const products = (data || []).map(p => ({
        ...p,
        stockStatus: getDerivedStockStatus(p.stock)
      })) as Product[];

      if (onUpdate) onUpdate(products);
      return products;
    } catch (error) {
      console.error('[ProductService] Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Paginated fetching using Supabase range.
   */
  getProductsPaginated: async (pageSize = 20, page = 0) => {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('name')
        .range(from, to);

      if (error) throw error;

      const products = (data || []).map(p => ({
        ...p,
        stockStatus: getDerivedStockStatus(p.stock)
      })) as Product[];

      return {
        products,
        nextPage: products.length === pageSize ? page + 1 : null,
        hasMore: (count || 0) > to + 1
      };
    } catch (error) {
      console.error('[ProductService] Pagination error:', error);
      throw error;
    }
  }
};
