'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
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

export default function ItemsManagement() {
  const [items, setItems] = useState<FirestoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<FirestoreItem, 'id' | 'quantitysold'>>({
    Item: '',
    Cost: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FirestoreItem | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('items'); // Collection selection state

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 px-6 py-10">
      <motion.h1
        className="text-4xl font-extrabold text-center mb-10 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🍽️ Items Management
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
                      className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-md"
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

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-xl border border-gray-700 shadow-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-800 text-gray-100 text-left text-sm uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3">Item Name</th>
              <th className="px-6 py-3">Cost</th>
              <th className="px-6 py-3">Quantity Sold</th>
              <th className="px-6 py-3">Actions</th>
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
                <td className="px-6 py-4">${item.Cost.toFixed(2)}</td>
                <td className="px-6 py-4">{item.quantitysold}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-md hover:bg-blue-600 text-blue-300 hover:text-white transition"
                    title="Edit"
                    disabled={loading}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteDialogOpen(item)}
                    className="p-2 rounded-md hover:bg-red-600 text-red-400 hover:text-white transition"
                    title="Delete"
                    disabled={loading}
                  >
                    <FaTrash />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] bg-white text-black p-6 rounded-xl shadow-2xl w-[90vw] max-w-md">
            <Dialog.Title className="text-xl font-bold text-center mb-4">
              Confirm Deletion
            </Dialog.Title>
            <p className="text-center mb-6">Are you sure you want to delete this item?</p>
            <div className="flex justify-between">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                disabled={loading}
              >
                Yes, Delete
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-black px-6 py-2 rounded-md"
                >
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
