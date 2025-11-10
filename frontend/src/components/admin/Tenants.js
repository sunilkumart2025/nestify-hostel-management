import React, { useState, useEffect } from 'react';
import { Users, Edit, Home, Download, X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editData, setEditData] = useState({ roomId: '', rentAmount: '' });

  useEffect(() => {
    fetchTenants();
    fetchRooms();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/api/admin/tenants');
      setTenants(response.data || []);
    } catch (error) {
      console.error('Fetch tenants error:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/admin/rooms');
      setRooms(response.data || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRooms([]);
    }
  };

  const handleViewDetails = (tenant) => {
    setSelectedTenant(tenant);
    setShowDetailsModal(true);
  };

  const handleEditRoom = (tenant) => {
    setSelectedTenant(tenant);
    setEditData({
      roomId: tenant.rooms?.id || '',
      rentAmount: tenant.rooms?.rent_amount || ''
    });
    setShowEditModal(true);
  };

  const updateTenantRoom = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/tenants/${selectedTenant.id}/room`, {
        roomId: editData.roomId,
        rentAmount: editData.rentAmount
      });
      toast.success('Tenant details updated successfully');
      setShowEditModal(false);
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update tenant');
    }
  };

  const downloadTenantPDF = async (tenantId) => {
    try {
      toast.loading('Generating PDF...');
      const response = await api.get(`/api/admin/tenants/${tenantId}/pdf`, {
        responseType: 'blob'
      });
      
      if (response.data.size === 0) {
        throw new Error('Empty PDF received');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nestify-tenant-${selectedTenant?.registration_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.dismiss();
      console.error('PDF download error:', error);
      toast.error(error.response?.data?.error || 'Failed to download PDF');
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
        <h2 className="text-2xl font-bold text-gray-900">Tenure Management</h2>
        <div className="text-sm text-gray-600">
          Total Tenures: {tenants.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => handleViewDetails(tenant)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                  <p className="text-sm text-gray-500">{tenant.registration_id}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {tenant.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Home className="h-4 w-4 text-gray-400 mr-2" />
                <span>{tenant.rooms?.room_number || 'No Room Assigned'}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span>Email: {tenant.email}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span>Phone: {tenant.phone}</span>
              </div>
              {tenant.rooms?.rent_amount && (
                <div className="text-sm font-medium text-green-600">
                  Rent: ₹{tenant.rooms.rent_amount}/month
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Details Modal */}
      {showDetailsModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Tenure Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Personal Information</h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">Registration ID</label>
                  <p className="text-gray-900">{selectedTenant.registration_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{selectedTenant.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedTenant.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{selectedTenant.phone}</p>
                </div>
                {selectedTenant.alt_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alternate Phone</label>
                    <p className="text-gray-900">{selectedTenant.alt_phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Admission Date</label>
                  <p className="text-gray-900">{new Date(selectedTenant.admission_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Room Information</h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">Room Number</label>
                  <p className="text-gray-900">{selectedTenant.rooms?.room_number || 'Not Assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Room Type</label>
                  <p className="text-gray-900">{selectedTenant.rooms?.room_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{selectedTenant.rooms?.location || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Monthly Rent</label>
                  <p className="text-gray-900 font-semibold text-green-600">
                    ₹{selectedTenant.rooms?.rent_amount || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedTenant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedTenant.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => downloadTenantPDF(selectedTenant.id)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEditRoom(selectedTenant);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Room Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={updateTenantRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <select
                  value={editData.roomId}
                  onChange={(e) => setEditData({...editData, roomId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} - {room.room_type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹)</label>
                <input
                  type="number"
                  value={editData.rentAmount}
                  onChange={(e) => setEditData({...editData, rentAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
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