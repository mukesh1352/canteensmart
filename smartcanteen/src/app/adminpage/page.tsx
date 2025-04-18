'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

interface FirestoreItem {
  id: string;
  Item: string;
  Cost: number;
  quantitysold: number;
}

export default function ItemsManagement() {
  const [items, setItems] = useState<FirestoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<FirestoreItem, 'id' | 'quantitysold'>>({ 
    Item: '', 
    Cost: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const itemsCollection = collection(db, 'items');
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          Item: data.Item || '',
          Cost: data.Cost || 0,
          quantitysold: data.quantitysold || 0
        };
      });
      setItems(itemsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Item' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update existing item (only Item and Cost)
        await updateDoc(doc(db, 'items', editingId), formData);
        setEditingId(null);
      } else {
        // Add new item with quantitysold fixed at 0
        await addDoc(collection(db, 'items'), {
          ...formData,
          quantitysold: 0 // Fixed value for new items
        });
      }
      // Reset form
      setFormData({ Item: '', Cost: 0 });
    } catch (error) {
      console.error("Error saving item: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: FirestoreItem) => {
    setFormData({
      Item: item.Item,
      Cost: item.Cost
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'items', id));
      } catch (error) {
        console.error("Error deleting item: ", error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && items.length === 0) {
    return <div className="p-4">Loading items...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Items Management</h1>
      
      {/* CRUD Form */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Edit Item' : 'Add New Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700">Item Name</label>
            <input
              type="text"
              name="Item"
              value={formData.Item}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700">Cost</label>
            <input
              type="number"
              name="Cost"
              value={formData.Cost}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ Item: '', Cost: 0 });
                }}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Item Name</th>
              <th className="py-2 px-4 border">Cost</th>
              <th className="py-2 px-4 border">Quantity Sold</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">
                  {item.Item || <span className="text-red-500">Not specified</span>}
                </td>
                <td className="py-2 px-4 border">${item.Cost.toFixed(2)}</td>
                <td className="py-2 px-4 border">{item.quantitysold}</td>
                <td className="py-2 px-4 border">
                  <button
                    onClick={() => handleEdit(item)}
                    className="mr-2 text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}