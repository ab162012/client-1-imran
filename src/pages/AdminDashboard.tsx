import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, setDoc, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { Product, Review, SiteSettings } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { STORE_ID } from '../constants';
import { 
  Loader2, Package, Edit2, Save, X, Plus, ShoppingBag, 
  LayoutDashboard, PlusCircle, Settings, LogOut, Image as ImageIcon, Trash2, Star, Menu, MessageSquare, LayoutTemplate, CheckCircle2, TrendingUp, BarChart3, RefreshCw, Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { migrateLegacyProducts } from '../seed';
import { ProductService } from '../services/ProductService';
import { OrderService } from '../services/OrderService';
import { ReviewService } from '../services/ReviewService';
import { SettingsService } from '../services/SettingsService';

export const AdminDashboard = () => {
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'add-product' | 'orders' | 'reviews' | 'research' | 'logo' | 'banner' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewForm, setNewReviewForm] = useState({ productId: '', customerName: '', rating: 5, comment: '', verified: true });
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'product' | 'order' | 'review' } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { settings: globalSettings } = useSettings();
  const navigate = useNavigate();

  // Pagination State
  const [lastProductDoc, setLastProductDoc] = useState<any>(null);
  const [lastOrderDoc, setLastOrderDoc] = useState<any>(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Product State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  // Add Product State
  const [newProduct, setNewProduct] = useState<Product>({
    id: '',
    name: '',
    price: 0,
    original_price: 0,
    description: '',
    image: '',
    images: [],
    notes: [],
    usage: '',
    featured: false,
    sizePrices: {
      '30ml': 0,
      '50ml': 0,
      '100ml': 0
    }
  });
  const [newNotesInput, setNewNotesInput] = useState('');

  // Settings State
  const [siteSettingsForm, setSiteSettingsForm] = useState<SiteSettings>({
    websiteName: '',
    logo: '',
    primaryColor: '#1E3A8A',
    footerText: '',
    instagramUrl: '',
    facebookUrl: '',
    heroProductId: ''
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  useEffect(() => {
    if (globalSettings) {
      setSiteSettingsForm(globalSettings);
    }
  }, [globalSettings]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      // Fetch products (first page)
      const prodResult = await ProductService.getProductsPaginated(15);
      setProducts(prodResult.products);
      setLastProductDoc(prodResult.lastDoc);
      setHasMoreProducts(prodResult.hasMore);

      // Fetch orders (first page)
      const orderResult = await OrderService.getOrdersPaginated(15);
      setOrders(orderResult.orders);
      setLastOrderDoc(orderResult.lastDoc);
      setHasMoreOrders(orderResult.hasMore);

      // Fetch counts
      const pCount = await ProductService.getProductCount();
      // For orders count, we could add a getOrderCount to OrderService
      // For now, using total fetched or a separate count call if needed
      setProductCount(pCount);
      setOrderCount(orderResult.orders.length); // Placeholder for total count

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Reviews still using onSnapshot for real-time moderation if needed, 
    // but scoped to store if we move reviews to store-scoped too.
    // For now, keeping it simple or refactoring reviews later.
    const unsubReviews = onSnapshot(collection(db, 'stores', STORE_ID, 'reviews'), (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      setReviews(reviewsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => {
      unsubReviews();
    };
  }, []);

  const loadMoreProducts = async () => {
    if (!lastProductDoc) return;
    try {
      const result = await ProductService.getProductsPaginated(15, lastProductDoc);
      setProducts(prev => [...prev, ...result.products]);
      setLastProductDoc(result.lastDoc);
      setHasMoreProducts(result.hasMore);
    } catch (error) {
      console.error("Error loading more products:", error);
    }
  };

  const loadMoreOrders = async () => {
    if (!lastOrderDoc) return;
    try {
      const result = await OrderService.getOrdersPaginated(15, lastOrderDoc);
      setOrders(prev => [...prev, ...result.orders]);
      setLastOrderDoc(result.lastDoc);
      setHasMoreOrders(result.hasMore);
    } catch (error) {
      console.error("Error loading more orders:", error);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('adminToken');
    navigate('/admin-login');
  };

  // --- Image Handling ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    
    // Basic validation
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      alert('Some files were not images and were skipped.');
    }
    
    // Size validation (limit to 500KB per image to avoid Firestore document limits)
    const MAX_SIZE = 500 * 1024;
    const oversizedFiles = validFiles.filter(file => file.size > MAX_SIZE);
    if (oversizedFiles.length > 0) {
      alert('Some images are too large (max 500KB). Please compress them.');
      return;
    }

    const promises = validFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64Images => {
      setNewProduct(prev => ({
        ...prev,
        images: [...(prev.images || []), ...base64Images],
        image: prev.image || base64Images[0] // Set first image as main if not set
      }));
    }).catch(err => {
      console.error('Error processing images:', err);
      alert('Failed to process images. Please try again.');
    });
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      return {
        ...prev,
        images: newImages,
        image: newImages.length > 0 ? newImages[0] : ''
      };
    });
  };

  // --- Product Actions ---
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      const { id: _, ...cleanEditForm } = editForm;
      // Ensure image is synced if images changed
      if (cleanEditForm.images && cleanEditForm.images.length > 0) {
        cleanEditForm.image = cleanEditForm.images[0];
      }
      
      // Filter out undefined values to prevent Firestore errors
      const productData = Object.fromEntries(
        Object.entries(cleanEditForm).filter(([_, v]) => v !== undefined)
      );

      await ProductService.updateProduct(editingId, productData);
      showSuccess('Product updated successfully');
      setEditingId(null);
      fetchData(true);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await ProductService.deleteProduct(id);
      showSuccess('Product deleted successfully');
      setDeleteConfirm(null);
      fetchData(true);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await OrderService.deleteOrder(id);
      showSuccess('Order deleted successfully');
      setDeleteConfirm(null);
      fetchData(true);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await ReviewService.deleteReview(id);
      showSuccess('Review deleted successfully');
      setDeleteConfirm(null);
      fetchData(true);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    const { id: _, ...cleanNewProduct } = newProduct;

    const productData = Object.fromEntries(
      Object.entries({
        ...cleanNewProduct,
        notes: newNotesInput ? newNotesInput.split(',').map(n => n.trim()).filter(n => n !== '') : [],
        createdAt: editingProduct?.createdAt || Date.now(),
        image: newProduct.images && newProduct.images.length > 0 ? newProduct.images[0] : newProduct.image,
        discount: newProduct.original_price && newProduct.original_price > (newProduct.price || 0) 
          ? Math.round(((newProduct.original_price - (newProduct.price || 0)) / newProduct.original_price) * 100) 
          : 0
      }).filter(([_, v]) => v !== undefined)
    );

    try {
      if (editingProduct) {
        // Update existing product
        await ProductService.updateProduct(editingProduct.id, productData);
        showSuccess('Product updated successfully');
      } else {
        // Add new product
        await ProductService.addProduct(productData);
        showSuccess('Product added successfully');
      }
      
      // Reset form
      setNewProduct({
        id: '',
        name: '',
        price: 0,
        original_price: 0,
        description: '',
        image: '',
        images: [],
        notes: [],
        usage: '',
        featured: false,
        sizePrices: {
          '30ml': 0,
          '50ml': 0,
          '100ml': 0
        }
      });
      setNewNotesInput('');
      setEditingProduct(null);
      setActiveTab('products');
      setIsSidebarOpen(false);
      fetchData(true);
    } catch (error) {
      console.error('Write failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startFullEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setNewNotesInput(product.notes.join(', '));
    setActiveTab('add-product');
  };

  const cancelFullEdit = () => {
    setEditingProduct(null);
    setNewProduct({
      id: '',
      name: '',
      price: 0,
      original_price: 0,
      description: '',
      image: '',
      images: [],
      notes: [],
      usage: '',
      featured: false,
      sizePrices: {
        '30ml': 0,
        '50ml': 0,
        '100ml': 0
      }
    });
    setNewNotesInput('');
    setActiveTab('products');
  };

  // --- Order Actions ---
  const handleOrderStatus = async (id: string, status: string) => {
    try {
      await OrderService.updateOrderStatus(id, status);
      showSuccess('Order status updated');
      fetchData(true);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  // --- Reviews Actions ---
  const handleReviewStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await ReviewService.updateReviewStatus(id, status);
      showSuccess('Review status updated');
      fetchData(true);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleAddManualReview = async () => {
    if (!newReviewForm.productId || !newReviewForm.customerName || !newReviewForm.comment) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const reviewData = Object.fromEntries(
        Object.entries({
          ...newReviewForm,
          status: 'approved',
          createdAt: Date.now()
        }).filter(([_, v]) => v !== undefined)
      );
      await ReviewService.addReview(reviewData);
      setNewReviewForm({ productId: '', customerName: '', rating: 5, comment: '', verified: true });
      setIsAddingReview(false);
      showSuccess('Verified review added successfully!');
      fetchData(true);
    } catch (error) {
      console.error('Add failed:', error);
    }
  };

  const [isMigrating, setIsMigrating] = useState(false);

  // --- Settings Actions ---
  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      const result = await migrateLegacyProducts(true);
      if (result.success) {
        showSuccess(`Successfully migrated ${result.count} products!`);
        fetchData(true);
      } else {
        showError(result.message || 'Migration failed');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      showError('Migration failed. Check console.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handlePrioritizeSignature = async () => {
    try {
      setIsMigrating(true);
      let count = 0;
      
      // Fetch ALL products from the store to ensure we catch those not on the current page
      const productsRef = ProductService.getCollectionRef();
      const snapshot = await getDocs(productsRef);
      
      for (const productDoc of snapshot.docs) {
        const data = productDoc.data();
        const name = (data.name || '').toLowerCase();
        if (name.includes('caliber') || name.includes('deep blue')) {
          await ProductService.updateProduct(productDoc.id, { priority: 100 });
          count++;
        }
      }
      
      if (count > 0) {
        showSuccess(`Successfully prioritized ${count} signature products!`);
        fetchData(true);
      } else {
        showError('No products matching "Caliber" or "Deep Blue" found.');
      }
    } catch (error) {
      console.error('Prioritization failed:', error);
      showError('Failed to prioritize products.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleRepairProducts = async () => {
    try {
      setIsMigrating(true);
      let count = 0;
      
      // Fetch ALL products to repair those missing the priority field
      const productsRef = ProductService.getCollectionRef();
      const snapshot = await getDocs(productsRef);

      for (const productDoc of snapshot.docs) {
        const data = productDoc.data();
        if (data.priority === undefined) {
          await ProductService.updateProduct(productDoc.id, { priority: 0 });
          count++;
        }
      }
      
      showSuccess(`Repaired ${count} products.`);
      fetchData(true);
    } catch (error) {
      console.error('Repair failed:', error);
      showError('Failed to repair products.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSubmitting(true);
      const settingsData = Object.fromEntries(
        Object.entries(siteSettingsForm).filter(([_, v]) => v !== undefined)
      ) as unknown as SiteSettings;
      await SettingsService.updateSettings(settingsData);
      showSuccess('Settings updated successfully');
      fetchData(true);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-dark" size={48} />
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'add-product', icon: PlusCircle, label: 'Add Product' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
    { id: 'research', icon: TrendingUp, label: 'Product Research' },
    { id: 'settings', icon: Settings, label: 'Site Settings' },
    { id: 'logo', icon: ImageIcon, label: 'Logo Manager' },
    { id: 'banner', icon: LayoutTemplate, label: 'Banner Manager' },
  ] as const;

  return (
    <div className="min-h-screen bg-white flex pt-20">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteConfirm(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div
            className="relative bg-white border-2 border-red-500 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="text-red-500" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Are you sure?</h3>
            <p className="text-blue-dark/60 mb-8 font-medium">This action cannot be undone. This {deleteConfirm.type} will be permanently removed.</p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'product') handleDeleteProduct(deleteConfirm.id);
                  else if (deleteConfirm.type === 'order') handleDeleteOrder(deleteConfirm.id);
                  else if (deleteConfirm.type === 'review') handleDeleteReview(deleteConfirm.id);
                }}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors"
              >
                Yes, Delete it
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full py-4 bg-blue-light text-black font-bold rounded-2xl hover:bg-blue transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative bg-white border-2 border-blue rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-blue-light p-6 border-b-2 border-blue flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-black tracking-tight">Order Details</h3>
                <p className="text-xs font-bold text-blue-dark/60">ID: {selectedOrder.id}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white rounded-full transition-colors border-2 border-transparent hover:border-blue"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Customer & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-blue-dark/40 uppercase tracking-widest">Customer Information</h4>
                  <div className="space-y-2 bg-blue-light/30 p-4 rounded-2xl border-2 border-blue/20">
                    <p className="font-bold text-black text-lg">{selectedOrder.customer?.name}</p>
                    <p className="text-sm text-blue-dark/70 font-medium">{selectedOrder.customer?.email}</p>
                    <p className="text-sm text-blue-dark/70 font-medium">{selectedOrder.customer?.phone}</p>
                    <div className="pt-2 mt-2 border-t border-blue/20">
                      <p className="text-xs font-bold text-blue-dark/40 uppercase mb-1">Shipping Address</p>
                      <p className="text-sm text-black font-medium leading-relaxed">
                        {selectedOrder.customer?.address}<br />
                        {selectedOrder.customer?.city}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-blue-dark/40 uppercase tracking-widest">Order Status</h4>
                  <div className="space-y-4 bg-blue-light/30 p-4 rounded-2xl border-2 border-blue/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-blue-dark/60">Current Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                        selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                        selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-dark/40 uppercase">Update Status</label>
                      <select 
                        value={selectedOrder.status} 
                        onChange={(e) => handleOrderStatus(selectedOrder.id, e.target.value)}
                        className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none font-bold text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="pt-2 text-[10px] font-medium text-blue-dark/40">
                      Placed on: {new Date(selectedOrder.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-blue-dark/40 uppercase tracking-widest">Order Items</h4>
                <div className="border-2 border-blue rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-blue-light/50 border-b-2 border-blue">
                      <tr className="text-[10px] font-black text-blue-dark/60 uppercase">
                        <th className="p-3">Product</th>
                        <th className="p-3">Size</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue/20">
                      {selectedOrder.products?.map((item: any, idx: number) => (
                        <tr key={idx} className="text-sm">
                          <td className="p-3 font-bold text-black">{item.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-blue-light border border-blue rounded-md text-[10px] font-bold text-black">
                              {item.selectedSize || item.size || '50ml'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-black text-blue-dark">x{item.quantity}</td>
                          <td className="p-3 text-right font-mono text-blue-dark/70">PKR {item.price?.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-bold text-black">PKR {(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-light/20 border-t-2 border-blue">
                      <tr>
                        <td colSpan={3} className="p-4 text-right font-black text-blue-dark uppercase tracking-wider">Total Amount</td>
                        <td className="p-4 text-right font-mono font-black text-black text-xl">PKR {selectedOrder.total?.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-blue-light/30 border-t-2 border-blue flex justify-end space-x-4">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-blue transition-all shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border-2 border-blue">
            <CheckCircle2 className="text-green-500" size={20} />
            <span className="font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border-2 border-red-500">
            <X className="text-red-500" size={20} />
            <span className="font-bold">{errorMessage}</span>
          </div>
        </div>
      )}
      
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-black text-white p-4 rounded-full shadow-xl"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-white border-r-2 border-blue
        overflow-y-auto z-40 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-black tracking-tight mb-8">Admin Panel</h2>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsSidebarOpen(false);
                }} 
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-light text-black shadow-sm border-2 border-blue' : 'text-blue-dark/60 hover:bg-blue-light hover:text-black border-2 border-transparent'}`}
              >
                <item.icon size={18} /> <span className="text-sm">{item.label}</span>
              </button>
            ))}
            <div className="pt-8 mt-8 border-t-2 border-blue">
              <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={18} /> <span className="text-sm">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
        <div key={activeTab}>
          {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-black">Dashboard Overview</h1>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="p-2 text-blue-dark hover:bg-blue-light rounded-full transition-colors disabled:opacity-50"
                  title="Refresh Data"
                >
                  <Loader2 className={refreshing ? 'animate-spin' : ''} size={20} />
                </button>
                <p className="text-sm font-medium text-blue-dark/60">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-light p-5 rounded-2xl border-2 border-blue shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-white text-black rounded-lg border-2 border-blue"><Package size={20} /></span>
                  <span className="text-xs font-bold text-blue-dark/70">Products</span>
                </div>
                <p className="text-2xl font-black text-black">{productCount || products.length}</p>
                <p className="text-xs font-medium text-blue-dark/60 mt-1">Total items in catalog</p>
              </div>
              
              <div className="bg-blue-light p-5 rounded-2xl border-2 border-blue shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-white text-black rounded-lg border-2 border-blue"><ShoppingBag size={20} /></span>
                  <span className="text-xs font-bold text-blue-dark/70">Orders</span>
                </div>
                <p className="text-2xl font-black text-black">{orderCount || orders.length}</p>
                <p className="text-xs font-medium text-blue-dark/60 mt-1">Total lifetime orders</p>
              </div>

              <div className="bg-blue-light p-5 rounded-2xl border-2 border-blue shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-white text-black rounded-lg border-2 border-blue"><TrendingUp size={20} /></span>
                  <span className="text-xs font-bold text-blue-dark/70">Revenue</span>
                </div>
                <p className="text-2xl font-black text-black">PKR {orders.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}</p>
                <p className="text-xs font-medium text-blue-dark/60 mt-1">Total sales value</p>
              </div>

              <div className="bg-blue-light p-5 rounded-2xl border-2 border-blue shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-white text-black rounded-lg border-2 border-blue"><Star size={20} /></span>
                  <span className="text-xs font-bold text-blue-dark/70">Featured</span>
                </div>
                <p className="text-2xl font-black text-black">{products.filter(p => p.featured).length}</p>
                <p className="text-xs font-medium text-blue-dark/60 mt-1">Featured items in store</p>
              </div>

              <div className="bg-blue-light p-5 rounded-2xl border-2 border-blue shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-white text-black rounded-lg border-2 border-blue"><Loader2 size={20} /></span>
                  <span className="text-xs font-bold text-blue-dark/70">Pending</span>
                </div>
                <p className="text-2xl font-black text-black">{orders.filter(o => o.status === 'pending').length}</p>
                <p className="text-xs font-medium text-blue-dark/60 mt-1">Awaiting processing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="bg-white p-6 rounded-3xl border-2 border-blue shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-black">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-blue-dark hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 hover:bg-blue-light rounded-xl transition-colors border-2 border-transparent hover:border-blue">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-light border-2 border-blue rounded-full flex items-center justify-center text-black font-bold text-xs">
                          {order.customer?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">{order.customer?.name}</p>
                          <p className="text-xs font-medium text-blue-dark/60">{new Date(order.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">PKR {order.total?.toLocaleString()}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-light text-black border border-blue'
                        }`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white p-6 rounded-3xl border-2 border-blue shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-black">Top Selling Products</h3>
                  <button onClick={() => setActiveTab('research')} className="text-xs font-bold text-blue-dark hover:underline">Insights</button>
                </div>
                <div className="space-y-4">
                  {[...products].sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0)).slice(0, 5).map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 hover:bg-blue-light rounded-xl transition-colors border-2 border-transparent hover:border-blue">
                      <div className="flex items-center space-x-3">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-blue" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-light border-2 border-blue flex items-center justify-center text-blue-dark">
                            <Package size={20} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-black">{product.name}</p>
                          <p className="text-xs font-medium text-blue-dark/60">{product.soldQuantity || 0} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">PKR {product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-black">Manage Products</h1>
              <button onClick={() => setActiveTab('add-product')} className="px-6 py-2 bg-black text-white font-bold rounded-full hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all flex items-center shadow-xl">
                <Plus size={18} className="mr-2" /> Add New
              </button>
            </div>
            
            <div className="bg-white rounded-3xl border-2 border-blue shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-blue-light text-black text-sm uppercase tracking-wider border-b-2 border-blue">
                      <th className="p-4 font-bold">Product</th>
                      <th className="p-4 font-bold">Price</th>
                      <th className="p-4 font-bold">Priority</th>
                      <th className="p-4 font-bold">Featured</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-blue">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-blue-light transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-light border-2 border-blue flex-shrink-0">
                              {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-blue-dark">
                                <Package size={24} />
                              </div>
                            )}
                            </div>
                            <div>
                              <div className="font-bold text-black">{product.name}</div>
                              <div className="text-xs text-blue-dark/60 font-medium truncate w-32 sm:w-48">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {editingId === product.id ? (
                            <div className="space-y-2">
                              <input type="number" className="w-24 px-2 py-1 border-2 border-blue bg-white text-black rounded-lg text-sm font-medium focus:border-black outline-none" placeholder="Price" value={editForm.price || ''} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} />
                              <input type="number" className="w-24 px-2 py-1 border-2 border-blue bg-white text-black rounded-lg text-sm font-medium focus:border-black outline-none" placeholder="Old Price" value={editForm.original_price || ''} onChange={e => setEditForm({ ...editForm, original_price: Number(e.target.value) })} />
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold text-black">PKR {product.price.toLocaleString()}</div>
                              {product.original_price && <div className="text-xs text-blue-dark/60 font-medium line-through">PKR {product.original_price.toLocaleString()}</div>}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {editingId === product.id ? (
                            <input type="number" className="w-16 px-2 py-1 border-2 border-blue bg-white text-black rounded-lg text-sm font-medium focus:border-black outline-none" value={editForm.priority || 0} onChange={e => setEditForm({ ...editForm, priority: Number(e.target.value) })} />
                          ) : (
                            <div className="font-bold text-black">{product.priority || 0}</div>
                          )}
                        </td>
                        <td className="p-4">
                          {editingId === product.id ? (
                            <input type="checkbox" className="w-5 h-5 accent-black" checked={editForm.featured || false} onChange={e => setEditForm({ ...editForm, featured: e.target.checked })} />
                          ) : (
                            product.featured ? <Star className="text-yellow-400" size={20} fill="currentColor" /> : <Star className="text-blue-dark/20" size={20} />
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {editingId === product.id ? (
                            <div className="flex justify-end space-x-2">
                              <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"><Save size={20} /></button>
                              <button onClick={() => setEditingId(null)} className="p-2 text-blue-dark/60 hover:bg-blue-light rounded-full transition-colors"><X size={20} /></button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => startFullEdit(product)} className="p-2 text-black hover:bg-blue-light rounded-full transition-colors" title="Full Edit"><Edit2 size={20} /></button>
                              <button onClick={() => setDeleteConfirm({ id: product.id, type: 'product' })} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete"><Trash2 size={20} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMoreProducts && (
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={loadMoreProducts}
                    className="px-8 py-3 bg-white text-black font-bold rounded-2xl border-2 border-blue hover:border-black transition-all shadow-sm"
                  >
                    Load More Products
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD/EDIT PRODUCT TAB */}
        {activeTab === 'add-product' && (
          <div className="max-w-3xl space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-black">{editingProduct ? 'Edit Product' : 'Add New Product'}</h1>
              {editingProduct && (
                <button onClick={cancelFullEdit} className="px-4 py-2 text-blue-dark/60 hover:text-black font-bold transition-colors">
                  Cancel Edit
                </button>
              )}
            </div>
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-blue shadow-sm space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Product Name</label>
                  <input type="text" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Current Price (PKR)</label>
                  <input type="number" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Old Price (PKR) - Optional</label>
                  <input type="number" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.original_price || ''} onChange={e => setNewProduct({...newProduct, original_price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Priority (Higher = Top)</label>
                  <input type="number" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.priority || 0} onChange={e => setNewProduct({...newProduct, priority: Number(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-blue">
                <h3 className="text-sm font-black text-blue-dark/40 uppercase tracking-widest">Size Pricing (Custom Prices)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-dark/70">30ml Price (PKR)</label>
                    <input type="number" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.sizePrices?.['30ml'] || ''} onChange={e => setNewProduct({...newProduct, sizePrices: { ...newProduct.sizePrices, '30ml': Number(e.target.value) }})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-dark/70">50ml Price (PKR)</label>
                    <input type="number" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.sizePrices?.['50ml'] || ''} onChange={e => setNewProduct({...newProduct, sizePrices: { ...newProduct.sizePrices, '50ml': Number(e.target.value) }})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-dark/70">100ml Price (PKR)</label>
                    <input type="number" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.sizePrices?.['100ml'] || ''} onChange={e => setNewProduct({...newProduct, sizePrices: { ...newProduct.sizePrices, '100ml': Number(e.target.value) }})} />
                  </div>
                </div>
                <p className="text-[10px] text-blue-dark/60 font-medium italic">* If left as 0, the main product price will be used for that size.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-dark/70">Description</label>
                <textarea rows={4} className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-dark/70">Badge (e.g. Hot Seller, #1 Seller)</label>
                <input type="text" placeholder="e.g. Hot Seller" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.badge || ''} onChange={e => setNewProduct({...newProduct, badge: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-dark/70">Category (e.g. Men, Women, Unisex)</label>
                <input type="text" placeholder="e.g. Unisex" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={newProduct.category || ''} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-dark/70">Product Images (Upload Multiple)</label>
                <div className="flex flex-col gap-4">
                  <input type="file" accept="image/*" multiple onChange={handleMultipleImageUpload} className="block w-full text-sm text-blue-dark/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-light file:text-black hover:file:bg-blue hover:file:text-white transition-colors" />
                  <p className="text-xs font-medium text-blue-dark/60">First image will be used as the main display image.</p>
                  
                  {newProduct.images && newProduct.images.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                      {newProduct.images.map((img, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-xl border-2 border-blue overflow-hidden shadow-sm">
                          <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
                            <X size={12} />
                          </button>
                          {idx === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black text-white text-[10px] font-bold text-center py-0.5">
                              MAIN
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t-2 border-blue">
                <input type="checkbox" id="featured" className="w-5 h-5 accent-black" checked={newProduct.featured} onChange={e => setNewProduct({...newProduct, featured: e.target.checked})} />
                <label htmlFor="featured" className="text-sm font-bold text-blue-dark/70">Set as Featured Product</label>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleAddProduct} 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all text-lg shadow-xl disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Processing...
                    </>
                  ) : (
                    editingProduct ? 'Update Product' : 'Save Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESEARCH TAB */}
        {activeTab === 'research' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-black">Product Research & Insights</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Best Sellers */}
              <div className="bg-white p-6 rounded-3xl border-2 border-blue shadow-sm">
                <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                  <TrendingUp className="mr-2 text-blue-dark" /> Best Selling Products
                </h2>
                <div className="space-y-4">
                  {[...products].sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0)).slice(0, 5).map((product, idx) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-blue-light rounded-xl border-2 border-blue">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-blue-dark/40 w-4">{idx + 1}</span>
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-blue" />
                        <span className="font-bold text-black">{product.name}</span>
                      </div>
                      <span className="font-mono font-bold text-black">{product.soldQuantity || 0} sold</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Viewed */}
              <div className="bg-white p-6 rounded-3xl border-2 border-blue shadow-sm">
                <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                  <BarChart3 className="mr-2 text-blue-dark" /> Most Viewed Products
                </h2>
                <div className="space-y-4">
                  {[...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((product, idx) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-blue-light rounded-xl border-2 border-blue">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-blue-dark/40 w-4">{idx + 1}</span>
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-blue" />
                        <span className="font-bold text-black">{product.name}</span>
                      </div>
                      <span className="font-mono font-bold text-black">{product.views || 0} views</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversion Rates */}
            <div className="bg-white p-6 rounded-3xl border-2 border-blue shadow-sm">
              <h2 className="text-xl font-bold text-black mb-4">Conversion Rates (Sold / Views)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-sm text-blue-dark/60 border-b-2 border-blue">
                      <th className="pb-3 font-bold">Product</th>
                      <th className="pb-3 font-bold">Views</th>
                      <th className="pb-3 font-bold">Sold</th>
                      <th className="pb-3 font-bold">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-blue">
                    {[...products].map(product => {
                      const views = product.views || 0;
                      const sold = product.soldQuantity || 0;
                      const conversion = views > 0 ? ((sold / views) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={product.id}>
                          <td className="py-3 font-bold text-black">{product.name}</td>
                          <td className="py-3 font-mono text-blue-dark/70 font-medium">{views}</td>
                          <td className="py-3 font-mono text-blue-dark/70 font-medium">{sold}</td>
                          <td className="py-3 font-mono font-bold text-black">{conversion}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-black">Recent Orders</h1>
            <div className="bg-white rounded-3xl border-2 border-blue shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-blue-light text-black text-sm uppercase tracking-wider border-b-2 border-blue">
                      <th className="p-4 font-bold">Order ID</th>
                      <th className="p-4 font-bold">Customer</th>
                      <th className="p-4 font-bold">Products</th>
                      <th className="p-4 font-bold">Total (PKR)</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-blue">
                    {orders.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-blue-dark/60 font-medium">No orders found.</td></tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-blue-light transition-colors">
                          <td className="p-4 font-mono text-sm font-bold text-black">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="text-blue-dark hover:underline flex items-center"
                            >
                              {order.id.slice(0, 8)}...
                              <LayoutTemplate size={14} className="ml-1" />
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-black">{order.customer?.name}</div>
                            <div className="text-xs text-blue-dark/60 font-medium">{order.customer?.email}</div>
                            <div className="text-xs text-blue-dark/60 font-medium">{order.customer?.phone}</div>
                            <div className="text-xs text-blue-dark/60 font-medium bg-blue-light p-1 rounded mt-1">{order.customer?.address}, {order.customer?.city}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-xs text-blue-dark/60 font-medium space-y-1">
                              {order.products?.map((p: any, idx: number) => (
                                <div key={idx} className="flex flex-col border-b border-blue/20 pb-1">
                                  <div className="flex justify-between gap-4">
                                    <span className="truncate max-w-[120px] font-bold text-black">{p.name}</span>
                                    <span className="font-black text-blue-dark">x{p.quantity}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-blue-dark/40 uppercase">{p.selectedSize || p.size || '50ml'}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-black">{order.total?.toLocaleString()}</td>
                          <td className="p-4">
                            <select 
                              value={order.status} 
                              onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-bold outline-none border-2 appearance-none cursor-pointer ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-sm font-medium text-blue-dark/60">{new Date(order.timestamp).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => setDeleteConfirm({ id: order.id, type: 'order' })} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {hasMoreOrders && (
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={loadMoreOrders}
                    className="px-8 py-3 bg-white text-black font-bold rounded-2xl border-2 border-blue hover:border-black transition-all shadow-sm"
                  >
                    Load More Orders
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-black">Manage Reviews</h1>
              <button 
                onClick={() => setIsAddingReview(!isAddingReview)}
                className="px-6 py-2 bg-black text-white font-bold rounded-full hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all flex items-center shadow-xl"
              >
                {isAddingReview ? 'Cancel' : <><Plus size={18} className="mr-2" /> Add Verified</>}
              </button>
            </div>

            {isAddingReview && (
              <div className="bg-white p-6 rounded-3xl border-2 border-blue shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-black">Add Manual Verified Review</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-dark/70">Select Product</label>
                    <select 
                      className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none font-medium"
                      value={newReviewForm.productId}
                      onChange={e => setNewReviewForm({...newReviewForm, productId: e.target.value})}
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-dark/70">Customer Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none font-medium"
                      placeholder="John Doe"
                      value={newReviewForm.customerName}
                      onChange={e => setNewReviewForm({...newReviewForm, customerName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-dark/70">Rating (1-5)</label>
                    <select 
                      className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none font-medium"
                      value={newReviewForm.rating}
                      onChange={e => setNewReviewForm({...newReviewForm, rating: Number(e.target.value)})}
                    >
                      {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <input 
                      type="checkbox" 
                      id="verified-check"
                      checked={newReviewForm.verified}
                      onChange={e => setNewReviewForm({...newReviewForm, verified: e.target.checked})}
                      className="w-5 h-5 accent-black"
                    />
                    <label htmlFor="verified-check" className="font-bold text-blue-dark/70">Mark as Verified</label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Comment</label>
                  <textarea 
                    rows={3}
                    className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none font-medium"
                    placeholder="Write the review comment here..."
                    value={newReviewForm.comment}
                    onChange={e => setNewReviewForm({...newReviewForm, comment: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleAddManualReview}
                  className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl"
                >
                  Save Verified Review
                </button>
              </div>
            )}

            <div className="bg-white rounded-3xl border-2 border-blue shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-blue-light text-black text-sm uppercase tracking-wider border-b-2 border-blue">
                      <th className="p-4 font-bold">Customer</th>
                      <th className="p-4 font-bold">Product</th>
                      <th className="p-4 font-bold">Rating</th>
                      <th className="p-4 font-bold">Comment</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-blue">
                    {reviews.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-blue-dark/60 font-medium">No reviews found.</td></tr>
                    ) : (
                      reviews.map(review => {
                        const product = products.find(p => p.id === review.productId);
                        return (
                          <tr key={review.id} className="hover:bg-blue-light transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-black">{review.customerName}</div>
                              {review.verified && <div className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 rounded-full inline-block font-bold uppercase">Verified</div>}
                            </td>
                            <td className="p-4 text-sm font-medium text-blue-dark/60">{product?.name || 'Unknown'}</td>
                            <td className="p-4">
                              <div className="flex text-yellow-400">
                                {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                              </div>
                            </td>
                            <td className="p-4 text-sm font-medium text-blue-dark/60 max-w-xs truncate">{review.comment}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${
                                review.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                review.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                {review.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end space-x-2">
                                {review.status !== 'approved' && (
                                  <button onClick={() => handleReviewStatus(review.id, 'approved')} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors" title="Approve">
                                    <CheckCircle2 size={20} />
                                  </button>
                                )}
                                {review.status !== 'rejected' && (
                                  <button onClick={() => handleReviewStatus(review.id, 'rejected')} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Reject">
                                    <X size={20} />
                                  </button>
                                )}
                                <button onClick={() => setDeleteConfirm({ id: review.id, type: 'review' })} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LOGO MANAGER TAB */}
        {activeTab === 'logo' && (
          <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-black">Logo Manager</h1>
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-blue shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="w-40 h-40 bg-blue-light rounded-2xl flex items-center justify-center overflow-hidden border-4 border-blue flex-shrink-0 shadow-sm">
                  {siteSettingsForm.logo ? (
                    <img src={siteSettingsForm.logo} alt="Site Logo" className="max-w-full max-h-full object-contain p-4" />
                  ) : (
                    <span className="text-black font-bold text-sm text-center px-2">No Logo Set</span>
                  )}
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <h3 className="font-bold text-black">Update Website Logo</h3>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (base64) => setSiteSettingsForm({...siteSettingsForm, logo: base64}))} className="block w-full text-sm text-blue-dark/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-light file:text-black hover:file:bg-blue hover:file:text-white transition-colors" />
                  <p className="text-xs font-medium text-blue-dark/60 leading-relaxed">Upload a high-quality transparent PNG. This logo will appear in the navigation bar and footer across the entire website.</p>
                  
                  <button onClick={handleSaveSettings} className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl">
                    Save Logo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BANNER MANAGER TAB */}
        {activeTab === 'banner' && (
          <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-black">Banner Manager</h1>
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-blue shadow-sm space-y-6">
              <p className="text-sm font-medium text-blue-dark/60">Select a product to feature on the homepage hero banner. The system will automatically pull its image, name, and price.</p>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-dark/70">Hero Featured Product</label>
                <select 
                  className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium"
                  value={siteSettingsForm.heroProductId || ''}
                  onChange={e => setSiteSettingsForm({...siteSettingsForm, heroProductId: e.target.value})}
                >
                  <option value="">-- Select a Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (PKR {p.price})</option>
                  ))}
                </select>
              </div>

              {siteSettingsForm.heroProductId && (
                <div className="mt-6 p-6 bg-blue-light rounded-2xl border-2 border-blue">
                  <h3 className="text-xs font-bold text-blue-dark/60 uppercase tracking-wider mb-4">Live Preview</h3>
                  {products.find(p => p.id === siteSettingsForm.heroProductId) && (
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm border-2 border-blue">
                        {siteSettingsForm.heroProductId && products.find(p => p.id === siteSettingsForm.heroProductId)?.image ? (
                        <img src={products.find(p => p.id === siteSettingsForm.heroProductId)?.image} alt="Hero" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-dark">
                          <Package size={32} />
                        </div>
                      )}
                      </div>
                      <div>
                        <div className="font-bold text-xl text-black">{products.find(p => p.id === siteSettingsForm.heroProductId)?.name}</div>
                        <div className="text-black font-bold text-lg mt-1">PKR {products.find(p => p.id === siteSettingsForm.heroProductId)?.price.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleSaveSettings} className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl">
                Save Banner Settings
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-black">Site Settings</h1>
            
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-blue shadow-sm space-y-8">
              
              <div className="space-y-6 border-b-2 border-blue pb-8">
                <h2 className="text-lg font-bold text-black">General Information</h2>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Website Name</label>
                      <input type="text" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={siteSettingsForm.websiteName || ''} onChange={e => setSiteSettingsForm({...siteSettingsForm, websiteName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Primary Color (Hex)</label>
                  <div className="flex items-center space-x-4">
                    <input type="color" className="w-12 h-12 p-1 border-2 border-blue bg-white rounded-xl cursor-pointer" value={siteSettingsForm.primaryColor || '#FFFFFF'} onChange={e => setSiteSettingsForm({...siteSettingsForm, primaryColor: e.target.value})} />
                    <input type="text" className="flex-1 p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={siteSettingsForm.primaryColor || '#FFFFFF'} onChange={e => setSiteSettingsForm({...siteSettingsForm, primaryColor: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Footer Text</label>
                  <input type="text" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={siteSettingsForm.footerText || ''} onChange={e => setSiteSettingsForm({...siteSettingsForm, footerText: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Hero Product (Featured on Home)</label>
                  <select 
                    className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium"
                    value={siteSettingsForm.heroProductId || ''}
                    onChange={e => setSiteSettingsForm({...siteSettingsForm, heroProductId: e.target.value})}
                  >
                    <option value="">-- No Featured Product --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-lg font-bold text-black">Social Links</h2>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Instagram URL</label>
                  <input type="text" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={siteSettingsForm.instagramUrl || ''} onChange={e => setSiteSettingsForm({...siteSettingsForm, instagramUrl: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-dark/70">Facebook URL</label>
                  <input type="text" className="w-full p-3 border-2 border-blue bg-white text-black rounded-xl focus:border-black outline-none transition-all font-medium" value={siteSettingsForm.facebookUrl || ''} onChange={e => setSiteSettingsForm({...siteSettingsForm, facebookUrl: e.target.value})} />
                </div>
              </div>
              
              <div className="pt-6 space-y-4">
                <button onClick={handleSaveSettings} className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-blue hover:text-white border-2 border-transparent hover:border-black transition-all shadow-xl">
                  Save All Settings
                </button>

                <div className="pt-8 border-t-2 border-blue">
                  <h3 className="text-sm font-bold text-blue-dark/40 uppercase tracking-widest mb-4">Data Management</h3>
                  <button 
                    onClick={handleMigrate} 
                    disabled={isMigrating}
                    className="w-full py-3 bg-white text-blue-dark font-bold rounded-xl border-2 border-blue hover:bg-blue-light transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    {isMigrating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    Migrate Legacy Products
                  </button>

                  <button 
                    onClick={handlePrioritizeSignature} 
                    disabled={isMigrating}
                    className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-blue-dark transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    <TrendingUp size={18} />
                    Prioritize Signature Fragrances (Caliber & Deep Blue)
                  </button>

                  <button 
                    onClick={handleRepairProducts} 
                    disabled={isMigrating}
                    className="w-full py-3 bg-white text-blue-dark font-bold rounded-xl border-2 border-blue hover:bg-blue-light transition-all flex items-center justify-center gap-2"
                  >
                    <Wrench size={18} />
                    Repair Products (Fix Sorting Field)
                  </button>
                  <p className="mt-2 text-[10px] text-blue-dark/50 font-medium text-center">
                    Use this if you have products in the old database structure that you want to bring into this store.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};
