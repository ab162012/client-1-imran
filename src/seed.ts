import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { STORE_ID } from './constants';

const PRODUCTS = [
  {
    id: 'baqarat-rouge-540',
    name: 'Baqarat Rouge 540',
    price: 3500,
    original_price: 5000,
    description: 'A sophisticated, woody fragrance with notes of jasmine, saffron, and cedarwood.',
    image: 'https://picsum.photos/seed/perfume1/800/800',
    images: ['https://picsum.photos/seed/perfume1/800/800'],
    notes: ['Jasmine', 'Saffron', 'Amberwood', 'Ambergris', 'Fir Resin', 'Cedar'],
    usage: 'Perfect for evening wear and special occasions.',
    featured: true,
    sizePrices: { '30ml': 2500, '50ml': 3500, '100ml': 6000 }
  },
  {
    id: 'aruj-al-oud',
    name: 'Aruj Al Oud',
    price: 4200,
    original_price: 6000,
    description: 'A deep, mysterious oud fragrance with hints of rose and sandalwood.',
    image: 'https://picsum.photos/seed/perfume2/800/800',
    images: ['https://picsum.photos/seed/perfume2/800/800'],
    notes: ['Oud', 'Rose', 'Sandalwood', 'Patchouli', 'Vanilla'],
    usage: 'Best for winter and formal events.',
    featured: true,
    sizePrices: { '30ml': 3000, '50ml': 4200, '100ml': 7500 }
  }
];

export const migrateLegacyProducts = async (force = false) => {
  try {
    const storeProductsRef = collection(db, 'stores', STORE_ID, 'products');
    const storeSnapshot = await getDocs(storeProductsRef);
    
    if (storeSnapshot.empty || force) {
      console.log(`Checking for legacy products to migrate to store ${STORE_ID}...`);
      const legacyProductsRef = collection(db, 'products');
      const legacySnapshot = await getDocs(legacyProductsRef);

      if (!legacySnapshot.empty) {
        console.log(`Migrating ${legacySnapshot.size} products from root to store ${STORE_ID}...`);
        const allowedFields = ['name', 'price', 'original_price', 'description', 'image', 'images', 'notes', 'usage', 'views', 'featured', 'createdAt', 'discount', 'reviewCount', 'sizePrices', 'category', 'badge'];
        
        for (const legacyDoc of legacySnapshot.docs) {
          try {
            const rawData = legacyDoc.data();
            const cleanedData: any = {};
            
            // Only copy allowed fields to satisfy strict security rules
            allowedFields.forEach(field => {
              if (rawData[field] !== undefined) {
                cleanedData[field] = rawData[field];
              }
            });

            // Ensure required fields exist for schema validation and match types
            if (typeof cleanedData.name !== 'string' || cleanedData.name.length === 0) cleanedData.name = "Unnamed Product";
            if (typeof cleanedData.price !== 'number') cleanedData.price = Number(cleanedData.price) || 0;
            if (typeof cleanedData.description !== 'string') cleanedData.description = String(cleanedData.description || "");
            if (typeof cleanedData.image !== 'string') cleanedData.image = String(cleanedData.image || "");
            if (!Array.isArray(cleanedData.notes)) cleanedData.notes = [];
            if (typeof cleanedData.usage !== 'string') cleanedData.usage = String(cleanedData.usage || "");
            
            // Handle optional fields that must be specific types
            if (cleanedData.original_price !== undefined) cleanedData.original_price = Number(cleanedData.original_price);
            if (cleanedData.featured !== undefined) cleanedData.featured = Boolean(cleanedData.featured);
            if (cleanedData.views !== undefined) cleanedData.views = Number(cleanedData.views);
            if (cleanedData.discount !== undefined) cleanedData.discount = Number(cleanedData.discount);
            if (cleanedData.reviewCount !== undefined) cleanedData.reviewCount = Number(cleanedData.reviewCount);
            if (cleanedData.images !== undefined && !Array.isArray(cleanedData.images)) cleanedData.images = [];
            if (cleanedData.sizePrices !== undefined && (typeof cleanedData.sizePrices !== 'object' || cleanedData.sizePrices === null)) cleanedData.sizePrices = {};
            if (cleanedData.category !== undefined) cleanedData.category = String(cleanedData.category);
            if (cleanedData.badge !== undefined) cleanedData.badge = String(cleanedData.badge);
            
            await setDoc(doc(db, 'stores', STORE_ID, 'products', legacyDoc.id), {
              ...cleanedData,
              createdAt: cleanedData.createdAt || Date.now()
            });
          } catch (err) {
            console.error(`Failed to migrate product ${legacyDoc.id}:`, err);
            // Continue with others
          }
        }
        console.log('Migration complete.');
        return { success: true, count: legacySnapshot.size };
      } else {
        console.log(`No legacy products found in root collection.`);
        return { success: false, message: 'No legacy products found in root collection.' };
      }
    }
    return { success: false, message: 'Store already has products. Use force=true to overwrite.' };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `migration/stores/${STORE_ID}`);
    throw error;
  }
};

export const seedProducts = async () => {
  try {
    const storeProductsRef = collection(db, 'stores', STORE_ID, 'products');
    const storeSnapshot = await getDocs(storeProductsRef);
    
    if (storeSnapshot.empty) {
      const migrationResult = await migrateLegacyProducts();
      
      if (!migrationResult.success) {
        console.log(`Seeding default products to store ${STORE_ID}...`);
        for (const product of PRODUCTS) {
          const { id, ...productData } = product;
          await setDoc(doc(db, 'stores', STORE_ID, 'products', id), {
            ...productData,
            createdAt: Date.now()
          });
        }
        console.log('Seeding complete.');
      }
    }
  } catch (error) {
    console.error('Error in seed process:', error);
  }
};
