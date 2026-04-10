export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  description: string;
  image: string;
  images?: string[];
  notes: string[];
  usage: string;
  stock?: number;
  totalStock?: number;
  soldQuantity?: number;
  lowStockThreshold?: number;
  views?: number;
  stockStatus?: 'In Stock' | 'Limited' | 'Out of Stock';
  featured?: boolean;
  badge?: string;
  category?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  products: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  timestamp: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  verified?: boolean;
  createdAt: number;
}

export interface SiteSettings {
  websiteName: string;
  logo: string;
  primaryColor: string;
  footerText: string;
  instagramUrl: string;
  facebookUrl: string;
  heroProductId: string;
}
