import { db } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { PRODUCTS } from './constants';

export const seedProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    if (querySnapshot.empty) {
      console.log('Seeding products to Firestore...');
      for (const product of PRODUCTS) {
        const { id, ...productData } = product;
        await setDoc(doc(db, 'products', id), productData);
      }
      console.log('Seeding complete.');
    }
  } catch (error) {
    console.error('Error seeding products:', error);
  }
};
