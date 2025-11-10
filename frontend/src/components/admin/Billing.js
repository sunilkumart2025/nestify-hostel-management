import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit, Eye, MoreVertical, Trash2, CreditCard } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [formData, setFormData] = useState({
    tenantId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    roomRent: '', electricityCharges: '', waterCharges: '', maintenanceCharges: '', internetCharges: '', otherCharges: ''
  });

  useEffect(() => {
    fetchBills();
    fetchTenants();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await api.get('/api/admin/bills');
      setBills(response.data);
    } catch (error) {
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get('/api/admin/tenants');
      setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch tenants');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/bills', formData);
      toast.success('Bill created successfully');
      setShowModal(false);
      setFormData({
        tenantId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
        roomRent: '', electricityCharges: '', waterCharges: '', maintenanceCharges: '', internetCharges: '', otherCharges: ''
      });
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create bill');
    }
  };

  const calculateTotal = () => {
    return (parseFloat(formData.roomRent || 0) + parseFloat(formData.electricityCharges || 0) + 
            parseFloat(formData.waterCharges || 0) + parseFloat(formData.maintenanceCharges || 0) + 
            parseFloat(formData.internetCharges || 0) + parseFloat(formData.otherCharges || 0)).toFixed(2);
  };

  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setShowDetailsModal(true);
    setShowActionMenu(null);
  };

  const editBill = (bill) => {
    setSelectedBill(bill);
    setFormData({
      tenantId: bill.tenant_id,
      month: bill.billing_month,
      year: bill.billing_year,
      roomRent: bill.room_rent,
      electricityCharges: bill.electricity_charges,
      waterCharges: bill.water_charges,
      maintenanceCharges: bill.maintenance_charges,
      internetCharges: bill.internet_charges,
      otherCharges: bill.other_charges
    });
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const markAsPaid = (bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
    setShowActionMenu(null);
  };

  const deleteBill = async (bill) => {
    if (window.confirm(`Delete bill ${bill.bill_number}?`)) {
      try {
        await api.delete(`/api/admin/bills/${bill.id}`);
        toast.success('Bill deleted successfully');
        fetchBills();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete bill');
      }
    }
    setShowActionMenu(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/bills/${selectedBill.id}`, formData);
      toast.success('Bill updated successfully');
      setShowEditModal(false);
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update bill');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.put(`/api/admin/bills/${selectedBill.id}/mark-paid`, {
        paymentMethod: formData.get('paymentMethod'),
        transactionReference: formData.get('transactionReference')
      });
      toast.success('Bill marked as paid successfully');
      setShowPaymentModal(false);
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark bill as paid');
    }
  };

  const downloadBillReport = async (bill) => {
    try {
      const response = await api.get(`/api/admin/invoice/${bill.id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${bill.bill_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Invoice downloaded for ${bill.bill_number}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to download invoice');
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
        <h2 className="text-2xl font-bold text-gray-900">Billing Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Bill
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bill.bill_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{bill.tenants?.name}</div>
                    <div className="text-sm text-gray-500">{bill.tenants?.registration_id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bill.billing_month}/{bill.billing_year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{parseFloat(bill.total_amount).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${bill.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                  <button 
                    onClick={() => setShowActionMenu(showActionMenu === bill.id ? null : bill.id)}
                    className="text-gray-600 hover:text-gray-900 p-1"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  {showActionMenu === bill.id && (
                    <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[150px]">
                      <button 
                        onClick={() => viewBillDetails(bill)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" /> Details
                      </button>
                      
                      {bill.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => editBill(bill)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </button>
                          <button 
                            onClick={() => markAsPaid(bill)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-green-600"
                          >
                            <CreditCard className="h-4 w-4 mr-2" /> Mark Paid
                          </button>
                          <button 
                            onClick={() => deleteBill(bill)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </button>
                        </>
                      )}
                      
                      {bill.status === 'paid' && (
                        <button 
                          onClick={() => downloadBillReport(bill)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" /> Invoice
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Bill Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Generate New Bill</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tenant</label>
                  <select
                    required
                    className="input-field mt-1"
                    value={formData.tenantId}
                    onChange={(e) => setFormData({...formData, tenantId: e.target.value})}
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} - {tenant.rooms?.room_number || 'No Room'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <select
                    className="input-field mt-1"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                  >
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', {month: 'long'})}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="number"
                    className="input-field mt-1"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Rent</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.roomRent}
                    onChange={(e) => setFormData({...formData, roomRent: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Electricity Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.electricityCharges}
                    onChange={(e) => setFormData({...formData, electricityCharges: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Water Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.waterCharges}
                    onChange={(e) => setFormData({...formData, waterCharges: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maintenance Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.maintenanceCharges}
                    onChange={(e) => setFormData({...formData, maintenanceCharges: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Internet Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.internetCharges}
                    onChange={(e) => setFormData({...formData, internetCharges: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Other Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.otherCharges}
                    onChange={(e) => setFormData({...formData, otherCharges: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-blue-600">₹{calculateTotal()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Edit Bill - {selectedBill?.bill_number}</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Rent</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.roomRent}
                    onChange={(e) => setFormData({...formData, roomRent: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Electricity Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.electricityCharges}
                    onChange={(e) => setFormData({...formData, electricityCharges: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Water Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.waterCharges}
                    onChange={(e) => setFormData({...formData, waterCharges: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maintenance Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.maintenanceCharges}
                    onChange={(e) => setFormData({...formData, maintenanceCharges: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Internet Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.internetCharges}
                    onChange={(e) => setFormData({...formData, internetCharges: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Other Charges</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.otherCharges}
                    onChange={(e) => setFormData({...formData, otherCharges: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-blue-600">₹{calculateTotal()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Details Modal */}
      {showDetailsModal && selectedBill && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Bill Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bill Number</p>
                    <p className="font-semibold">{selectedBill.bill_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`badge ${selectedBill.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {selectedBill.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Billing Period</p>
                    <p className="font-semibold">{selectedBill.billing_month}/{selectedBill.billing_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Generated Date</p>
                    <p className="font-semibold">{new Date(selectedBill.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Tenant Info */}
              <div>
                <h4 className="font-semibold mb-3">Tenant Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedBill.tenants?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registration ID</p>
                    <p className="font-medium">{selectedBill.tenants?.registration_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room Number</p>
                    <p className="font-medium">{selectedBill.rooms?.room_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Charges Breakdown</h4>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parseFloat(selectedBill.room_rent || 0) > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm">Room Rent</td>
                          <td className="px-4 py-2 text-sm text-right">₹{parseFloat(selectedBill.room_rent).toFixed(2)}</td>
                        </tr>
                      )}
                      {parseFloat(selectedBill.electricity_charges || 0) > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm">Electricity Charges</td>
                          <td className="px-4 py-2 text-sm text-right">₹{parseFloat(selectedBill.electricity_charges).toFixed(2)}</td>
                        </tr>
                      )}
                      {parseFloat(selectedBill.water_charges || 0) > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm">Water Charges</td>
                          <td className="px-4 py-2 text-sm text-right">₹{parseFloat(selectedBill.water_charges).toFixed(2)}</td>
                        </tr>
                      )}
                      {parseFloat(selectedBill.maintenance_charges || 0) > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm">Maintenance Charges</td>
                          <td className="px-4 py-2 text-sm text-right">₹{parseFloat(selectedBill.maintenance_charges).toFixed(2)}</td>
                        </tr>
                      )}
                      {parseFloat(selectedBill.internet_charges || 0) > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm">Internet/Wi-Fi Charges</td>
                          <td className="px-4 py-2 text-sm text-right">₹{parseFloat(selectedBill.internet_charges).toFixed(2)}</td>
                        </tr>
                      )}
                      {parseFloat(selectedBill.other_charges || 0) > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm">Other Charges</td>
                          <td className="px-4 py-2 text-sm text-right">₹{parseFloat(selectedBill.other_charges).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="bg-blue-50 font-semibold">
                        <td className="px-4 py-3 text-sm">Total Amount</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">₹{parseFloat(selectedBill.total_amount).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {selectedBill.status === 'paid' && (
                  <button
                    onClick={() => {
                      downloadBillReport(selectedBill);
                      setShowDetailsModal(false);
                    }}
                    className="btn-primary flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h3 className="text-lg font-semibold mb-4">Mark as Paid - {selectedBill?.bill_number}</h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select name="paymentMethod" className="input-field mt-1" required>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  name="transactionReference"
                  className="input-field mt-1"
                  placeholder="Receipt number, cheque number, etc."
                />
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-800">Amount: ₹{selectedBill?.total_amount}</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Mark as Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Click outside to close action menu */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  );
};

export default Billing;