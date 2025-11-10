import React, { useState, useEffect } from 'react';
import { Users, Edit, Home } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  useEffect(() => {
    fetchTenants();
    fetchRooms();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await axios.get('/admin/tenants');
      setTenants(response.data);
    } catch (error) {
      toast.error('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/admin/rooms');
      setRooms(response.data.filter(room => !room.is_occupied));
    } catch (error) {
      console.error('Failed to fetch rooms');
    }
  };

  const handleAssignRoom = (tenant) => {
    setSelectedTenant(tenant);
    setSelectedRoomId(tenant.rooms?.id || '');
    setShowRoomModal(true);
  };

  const assignRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/admin/tenants/${selectedTenant.id}/room`, {
        roomId: selectedRoomId
      });
      toast.success('Room assigned successfully');
      setShowRoomModal(false);
      setSelectedTenant(null);
      setSelectedRoomId('');
      fetchTenants();
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign room');
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
        <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
        <div className="text-sm text-gray-600">
          Total Tenants: {tenants.length}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.email}</div>
                    <div className="text-sm text-gray-500">{tenant.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {tenant.rooms?.room_number || 'Not assigned'}
                      </div>
                      {tenant.rooms?.rent_amount && (
                        <div className="text-sm text-gray-500">
                          ₹{tenant.rooms.rent_amount}/month
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {tenant.registration_id}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${tenant.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleAssignRoom(tenant)}
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                    title="Assign/Change Room"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {tenant.rooms ? 'Change Room' : 'Assign Room'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Room Assignment Modal */}
      {showRoomModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold mb-4">
              Assign Room to {selectedTenant?.name}
            </h3>
            <form onSubmit={assignRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Room</label>
                <select
                  required
                  className="input-field mt-1"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                >
                  <option value="">Choose a room</option>
                  {selectedTenant?.rooms && (
                    <option value={selectedTenant.rooms.id}>
                      {selectedTenant.rooms.room_number} (Current Room)
                    </option>
                  )}
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} - {room.room_type} (₹{room.rent_amount})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTenant?.rooms && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Current Room:</strong> {selectedTenant.rooms.room_number}
                  </p>
                  <p className="text-sm text-yellow-700">
                    Changing room will update occupancy status automatically.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoomModal(false);
                    setSelectedTenant(null);
                    setSelectedRoomId('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Assign Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;