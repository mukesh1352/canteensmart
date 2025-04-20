'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import SensorData from '../components/watersensor';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface FirestoreItem {
  id: string;
  Item: string;
  Cost: number;
  quantitysold: number;
}

interface TokenItem {
  id: string;
  token: string;
  itemName: string;
  username: string;
  timestamp: string;
}

export default function ItemsManagement() {
  const [items, setItems] = useState<FirestoreItem[]>([]);
  const [tokens, setTokens] = useState<TokenItem[]>([]); // State to store token data
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<FirestoreItem, 'id' | 'quantitysold'>>({
    Item: '',
    Cost: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTokenDialogOpen, setDeleteTokenDialogOpen] = useState(false); // Token delete dialog
  const [itemToDelete, setItemToDelete] = useState<FirestoreItem | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<TokenItem | null>(null); // State to store token to delete
  const [selectedCollection, setSelectedCollection] = useState<string>('items'); // Collection selection state
  const [canteenName, setCanteenName] = useState<string>('IT'); // Canteen name

  // Fetch data from Firestore based on selected collection for items
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
  }, [selectedCollection, canteenName]); // Run the effect when the collection or canteenName changes

  // Fetch token data from Firestore based on selected canteen
  useEffect(() => {
    const tokensCollection = collection(db, 'orders');
    const queryRef = query(tokensCollection, where('collection', '==', canteenName)); // Filter by canteen name

    const unsubscribe = onSnapshot(queryRef, (snapshot) => {
      const tokenData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          token: data.token || '',
          itemName: data.itemName || '',
          username: data.username || '',
          timestamp: data.timestamp?.toDate().toLocaleString() || '',
        };
      });
      setTokens(tokenData);
    });

    return () => unsubscribe();
  }, [canteenName]); // Fetch tokens whenever canteenName changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'Item' ? value : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, selectedCollection, editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, selectedCollection), {
          ...formData,
          quantitysold: 0,
        });
      }
      setFormData({ Item: '', Cost: 0 });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving item: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: FirestoreItem) => {
    setFormData({ Item: item.Item, Cost: item.Cost });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleDeleteDialogOpen = (item: FirestoreItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTokenDialogOpen = (token: TokenItem) => {
    setTokenToDelete(token);
    setDeleteTokenDialogOpen(true); // Open token delete dialog
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      setLoading(true);

      try {
        await deleteDoc(doc(db, selectedCollection, itemToDelete.id));
      } catch (error) {
        console.error('Error deleting item: ', error);
      } finally {
        setLoading(false);
      }
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteToken = async () => {
    if (tokenToDelete) {
      setLoading(true);

      try {
        await deleteDoc(doc(db, 'orders', tokenToDelete.id)); // Deleting token from 'orders' collection
      } catch (error) {
        console.error('Error deleting token: ', error);
      } finally {
        setLoading(false);
      }
    }
    setDeleteTokenDialogOpen(false);
    setTokenToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 px-6 py-10">
      <motion.h1
        className="text-4xl font-extrabold text-center mb-10 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🍽️ {canteenName} Canteen Items Management
      </motion.h1>

      {/* Dropdown for Collection Selection */}
      <div className="mb-6">
        <label className="text-sm text-gray-300 mr-2">Select Canteen: </label>
        <select
          value={canteenName}
          onChange={(e) => {
            setCanteenName(e.target.value);
            setSelectedCollection(
              e.target.value === 'IT'
                ? 'items'
                : e.target.value === 'MBA'
                ? 'items1'
                : 'items2'
            );
          }}
          className="p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
        >
          <option value="IT">IT</option>
          <option value="MBA">MBA</option>
          <option value="MAIN">MAIN</option>
        </select>
      </div>

      <div className="flex justify-end mb-6">
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium shadow-md transition">
              + Add New Item
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] bg-white text-black p-6 rounded-xl shadow-2xl w-[90vw] max-w-md">
              <Dialog.Title className="text-2xl font-bold mb-4 text-center">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <input
                    name="Item"
                    value={formData.Item}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cost</label>
                  <input
                    type="number"
                    name="Cost"
                    value={formData.Cost}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex justify-between mt-6">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm"
                    disabled={loading}
                  >
                    {editingId ? 'Update Item' : 'Add Item'}
                  </button>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({ Item: '', Cost: 0 });
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Items List */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Items</h2>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between items-center bg-gray-700 p-4 rounded-md">
              <div>
                <h3 className="font-semibold">{item.Item}</h3>
                <p className="text-sm text-gray-400">Cost: {item.Cost} | Sold: {item.quantitysold}</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-indigo-500 hover:text-indigo-600"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteDialogOpen(item)}
                  className="text-red-500 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Tokens List */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Tokens</h2>
        <ul className="space-y-4">
          {tokens.map((token) => (
            <li key={token.id} className="flex justify-between items-center bg-gray-700 p-4 rounded-md">
              <div>
                <h3 className="font-semibold">Token: {token.token}</h3>
                <p className="text-sm text-gray-400">Item: {token.itemName} | User: {token.username}</p>
                <p className="text-sm text-gray-400">Timestamp: {token.timestamp}</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDeleteTokenDialogOpen(token)}
                  className="text-red-500 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Delete Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] bg-white text-black p-6 rounded-xl shadow-2xl w-[90vw] max-w-md">
            <Dialog.Title className="text-2xl font-bold mb-4 text-center">
              Confirm Deletion
            </Dialog.Title>
            <p className="text-sm mb-4">Are you sure you want to delete this item?</p>
            <div className="flex justify-between mt-6">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm"
              >
                Yes, Delete
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm"
                >
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Token Dialog */}
      <Dialog.Root open={deleteTokenDialogOpen} onOpenChange={setDeleteTokenDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] bg-white text-black p-6 rounded-xl shadow-2xl w-[90vw] max-w-md">
            <Dialog.Title className="text-2xl font-bold mb-4 text-center">
              Confirm Token Deletion
            </Dialog.Title>
            <p className="text-sm mb-4">Are you sure you want to delete this token?</p>
            <div className="flex justify-between mt-6">
              <button
                onClick={handleDeleteToken}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm"
              >
                Yes, Delete
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm"
                >
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <SensorData />
    </div>
  );
}
