import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { createClient } from '@supabase/supabase-js';
import fs from "fs";

// Load Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Supabase config (Assuming these are set in the environment or .env)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("🚀 Starting migration from Firebase to Supabase...");

  try {
    // 1. Migrate Products
    console.log("📦 Migrating products...");
    const productsSnap = await getDocs(collection(db, "products"));
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const p of products) {
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
