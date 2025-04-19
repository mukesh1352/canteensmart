'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface Order {
  token: string;
  itemName: string;
  cost: number;
  timestamp: Timestamp; // 🔧 Fixed: Replaced 'any' with 'Timestamp'
  collection: string;
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const username = localStorage.getItem('token');
      if (!username) {
        return;
      }

      const ordersQuery = query(collection(db, 'orders'), where('username', '==', username));
      const querySnapshot = await getDocs(ordersQuery);
      const ordersData = querySnapshot.docs.map(doc => doc.data() as Order);

      setOrders(ordersData);
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold text-center mb-8">Your Order History</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-400">No orders placed yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold">{order.itemName}</h2>
              <p className="text-lg">Token: {order.token}</p>
              <p className="text-lg">Cost: ₹{order.cost}</p>
              <p className="text-sm text-gray-400">Ordered on: {order.timestamp.toDate().toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
