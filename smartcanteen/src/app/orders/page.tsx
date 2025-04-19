'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Item {
  id: string;
  Item: string;
  Cost: number;
  quantitysold: number;
}

const COLLECTION_MAP: Record<string, string> = {
  MAIN: 'items2',
  IT: 'items',
  MBA: 'items1',
};

export default function OrdersPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('MAIN');
  const [loading, setLoading] = useState(false);
  const [disabledItemId, setDisabledItemId] = useState<string | null>(null);
  const router = useRouter();

  const fetchItems = async (label: string) => {
    setLoading(true);
    const collectionName = COLLECTION_MAP[label];
    try {
      const itemsSnapshot = await getDocs(collection(db, collectionName));
      const itemsData = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Item, 'id'>),
      }));
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(selectedLabel);
  }, [selectedLabel]);

  const handleBuy = async (item: Item) => {
    const username = localStorage.getItem('token');
    if (!username) {
      alert('You must be logged in to place an order');
      return;
    }

    if (disabledItemId === item.id) return;

    const token = `ORD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now()}`;
    alert(`Order placed! Your token number is: ${token}`);

    setDisabledItemId(item.id);

    const collectionName = COLLECTION_MAP[selectedLabel];
    const itemRef = doc(db, collectionName, item.id);

    try {
      await updateDoc(itemRef, {
        quantitysold: increment(1),
      });

      await addDoc(collection(db, 'orders'), {
        token,
        itemName: item.Item,
        cost: item.Cost,
        timestamp: new Date(),
        collection: selectedLabel,
        username,
      });

      router.push('/'); // Redirect to homepage after placing the order
    } catch (error) {
      console.error('Error updating item or saving order:', error);
    } finally {
      setDisabledItemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <motion.h1
        className="text-4xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🍽️ Orders Page
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

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
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
                onClick={() => handleBuy(item)}
                disabled={disabledItemId === item.id}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:bg-gray-500"
              >
                {disabledItemId === item.id ? 'Processing...' : 'Buy'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
