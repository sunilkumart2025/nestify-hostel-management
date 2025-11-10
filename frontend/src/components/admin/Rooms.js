import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '', occupancyLimit: '', roomType: '', location: '', rentAmount: ''
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/admin/rooms');
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await axios.put(`/admin/rooms/${editingRoom.id}`, formData);
        toast.success('Room updated successfully');
      } else {
        await axios.post('/admin/rooms', formData);
        toast.success('Room added successfully');
      }
      setShowModal(false);
      setEditingRoom(null);
      setFormData({ roomNumber: '', occupancyLimit: '', roomType: '', location: '', rentAmount: '' });
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.room_number,
      occupancyLimit: room.occupancy_limit,
      roomType: room.room_type,
      location: room.location,
      rentAmount: room.rent_amount
    });
    setShowModal(true);
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await axios.delete(`/admin/rooms/${roomId}`);
        toast.success('Room deleted successfully');
        fetchRooms();
      } catch (error) {
        toast.error('Failed to delete room');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Room {room.room_number}</h3>
                <p className="text-sm text-gray-500">{room.room_type}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(room)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Capacity:</span>
                <span className="text-sm font-medium">{room.occupancy_limit} persons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Location:</span>
                <span className="text-sm font-medium">{room.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rent:</span>
                <span className="text-sm font-medium">₹{room.rent_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${room.is_occupied ? 'text-red-600' : 'text-green-600'}`}>
                  {room.is_occupied ? 'Occupied' : 'Available'}
                </span>
              </div>
            </div>

            {room.tenants && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{room.tenants.name}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Room Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold mb-4">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Number</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Occupancy Limit</label>
                <input
                  type="number"
                  required
                  className="input-field mt-1"
                  value={formData.occupancyLimit}
                  onChange={(e) => setFormData({...formData, occupancyLimit: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Type</label>
                <select
                  required
                  className="input-field mt-1"
                  value={formData.roomType}
                  onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                >
                  <option value="">Select Type</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Triple">Triple</option>
                  <option value="Dormitory">Dormitory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rent Amount</label>
                <input
                  type="number"
                  required
                  className="input-field mt-1"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({...formData, rentAmount: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoom(null);
                    setFormData({ roomNumber: '', occupancyLimit: '', roomType: '', location: '', rentAmount: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRoom ? 'Update' : 'Add'} Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;