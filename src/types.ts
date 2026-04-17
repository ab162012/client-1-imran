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
  views?: number;
  featured?: boolean;
  badge?: string;
  category?: string;
  sizePrices?: {
    '30ml'?: number;
    '50ml'?: number;
    '100ml'?: number;
  };
  reviewCount?: number;
  priority?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: '30ml' | '50ml' | '100ml';
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
    size: string;
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
