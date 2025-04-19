'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust this path if needed
import { motion } from 'framer-motion';

interface Item {
  id: string;
  Item: string;
  Cost: number;
  quantitysold: number;
}

// Map for dropdown display -> Firestore collection name
const COLLECTION_MAP: Record<string, string> = {
  MAIN: 'items2',
  IT: 'items',
  MBA: 'items1',
};

export default function OrdersPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('MAIN');

  const fetchItems = async (label: string) => {
    const collectionName = COLLECTION_MAP[label];
    const itemsSnapshot = await getDocs(collection(db, collectionName));
    const itemsData = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Item, 'id'>),
    }));
    setItems(itemsData);
  };

  useEffect(() => {
    fetchItems(selectedLabel);
  }, [selectedLabel]);

  const handleBuy = async (itemId: string) => {
    const token = Math.floor(1000 + Math.random() * 9000);
    alert(`Order placed! Your token number is: ${token}`);

    const collectionName = COLLECTION_MAP[selectedLabel];
    const itemRef = doc(db, collectionName, itemId);
    await updateDoc(itemRef, {
      quantitysold: increment(1),
    });

    // Refresh items after update
    fetchItems(selectedLabel);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <motion.h1
        className="text-4xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🛍️ Orders Page
      </motion.h1>

      <div className="flex justify-center mb-6">
        <select
          value={selectedLabel}
          onChange={(e) => setSelectedLabel(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          {Object.keys(COLLECTION_MAP).map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <motion.div
            key={item.id}
            className="bg-gray-800 p-6 rounded-xl shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-semibold mb-2">{item.Item}</h2>
            <p className="text-lg mb-4">💰 ₹{item.Cost}</p>
            <button
              onClick={() => handleBuy(item.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Buy
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
