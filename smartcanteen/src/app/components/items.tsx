'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

interface FirestoreItem {
  id: string;
  Item: string;
  Cost: number;
  quantitysold: number;
}

export default function ItemsDisplay() {
  const [items, setItems] = useState<FirestoreItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('items'); // Collection selection state
  const router = useRouter(); // Initialize useRouter

  // Fetch data from Firestore based on selected collection
  useEffect(() => {
    const itemsCollection = collection(db, selectedCollection);
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const itemsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          Item: data.Item || '',
          Cost: data.Cost || 0,
          quantitysold: data.quantitysold || 0,
        };
      });
      setItems(itemsData);
    });

    return () => unsubscribe();
  }, [selectedCollection]); // Run the effect when the collection changes

  // Handle redirect to the "orders" page
  const handleRedirect = () => {
    router.push('/orders'); // Redirect to the orders page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 px-6 py-10 flex flex-col items-center">
      <motion.h1
        className="text-4xl font-extrabold text-center mb-10 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🍽️ Items Display
      </motion.h1>

      {/* Dropdown for Collection Selection */}
      <div className="mb-6">
        <label className="text-sm text-gray-300 mr-2">Select Collection: </label>
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
        >
          <option value="items">IT</option>
          <option value="items1">MBA</option>
          <option value="items2">MAIN</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-xl border border-gray-700 shadow-lg w-full">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-800 text-gray-100 text-left text-sm uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3">Item Name</th>
              <th className="px-6 py-3">Cost</th>
              {/* <th className="px-6 py-3">Quantity Sold</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {items.map((item) => (
              <motion.tr
                key={item.id}
                className="hover:bg-gray-800 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <td className="px-6 py-4">{item.Item}</td>
                <td className="px-6 py-4">{item.Cost.toFixed(2)}</td>
                {/* <td className="px-6 py-4">{item.quantitysold}</td> */}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Button to navigate to Orders page */}
      <button
        onClick={handleRedirect}
        className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-md transition"
      >
        Go to Orders
      </button>
    </div>
  );
}
