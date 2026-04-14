import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { createClient } from '@supabase/supabase-js';
import fs from "fs";
import axios from 'axios';

// Load Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImageToStorage(urlOrBase64: string): Promise<string | null> {
  if (!urlOrBase64) return null;
  
  try {
    let buffer: Buffer;
    let contentType: string;
    let fileName: string;

    if (urlOrBase64.startsWith('data:')) {
      // Handle Base64
      const matches = urlOrBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return urlOrBase64;
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      fileName = `${Math.random().toString(36).substring(2, 15)}.${contentType.split('/')[1]}`;
    } else if (urlOrBase64.startsWith('http')) {
      // Handle URL
      const response = await axios.get(urlOrBase64, { responseType: 'arraybuffer' });
      buffer = Buffer.from(response.data, 'binary');
      contentType = response.headers['content-type'];
      fileName = `${Math.random().toString(36).substring(2, 15)}.${urlOrBase64.split('.').pop()?.split('?')[0] || 'jpg'}`;
    } else {
      return urlOrBase64;
    }

    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, buffer, { contentType });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  } catch (err) {
    console.error("Failed to migrate image:", err);
    return urlOrBase64; // Fallback to original
  }
}

async function migrate() {
  console.log("🚀 Starting migration from Firebase to Supabase with Storage...");

  try {
    // 1. Migrate Products
    console.log("📦 Migrating products...");
    const productsSnap = await getDocs(collection(db, "products"));
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const p of products as any) {
      console.log(`  - Migrating product: ${p.name}`);
      // Migrate main image
      if (p.image) p.image = await uploadImageToStorage(p.image);
      // Migrate gallery images
      if (p.images && Array.isArray(p.images)) {
        p.images = await Promise.all(p.images.map((img: string) => uploadImageToStorage(img)));
      }
      
      const { error } = await supabase.from('products').upsert(p);
      if (error) console.error(`❌ Error migrating product ${p.id}:`, error.message);
    }
    console.log(`✅ Migrated ${products.length} products.`);

    // 2. Migrate Orders
    console.log("🛒 Migrating orders...");
    const ordersSnap = await getDocs(collection(db, "orders"));
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const o of orders) {
      const { error } = await supabase.from('orders').upsert(o);
      if (error) console.error(`❌ Error migrating order ${o.id}:`, error.message);
    }
    console.log(`✅ Migrated ${orders.length} orders.`);

    // 3. Migrate Reviews
    console.log("⭐ Migrating reviews...");
    const reviewsSnap = await getDocs(collection(db, "reviews"));
    const reviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const r of reviews) {
      const { error } = await supabase.from('reviews').upsert(r);
      if (error) console.error(`❌ Error migrating review ${r.id}:`, error.message);
    }
    console.log(`✅ Migrated ${reviews.length} reviews.`);

    console.log("🎉 Migration completed successfully!");
  } catch (err: any) {
    console.error("💥 Migration failed:", err.message);
  }
  
  process.exit(0);
}

migrate();
