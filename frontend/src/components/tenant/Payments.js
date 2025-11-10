import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Payments = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [filter]);

  const fetchBills = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/api/tenant/bills', { params });
      setBills(response.data);
    } catch (error) {
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (billId) => {
    if (paymentLoading) return;
    
    setPaymentLoading(true);
    
    try {
      // Create payment order
      const orderResponse = await api.post('/api/payment/create-order', { billId });
      const { orderId, amount, currency, keyId } = orderResponse.data;

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page.');
        setPaymentLoading(false);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Nestify Hostel',
        description: 'Rent Payment',
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await api.post('/api/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              billId: billId
            });
            
            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              fetchBills(); // Refresh bills
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'Tenant Name',
          email: 'tenant@example.com'
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          }
        },
        notes: {
          bill_id: billId
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error('Payment failed: ' + response.error.description);
        setPaymentLoading(false);
      });
      
      rzp.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
      setPaymentLoading(false);
    }
  };

  const downloadInvoice = async (billId) => {
    try {
      const response = await axios.get(`/payment/invoice/${billId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
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
        <h2 className="text-2xl font-bold text-gray-900">Payments & Bills</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'paid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Payment Status Alert */}
      {paymentLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              Processing payment... Please complete the payment in the popup window.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {bills.length > 0 ? (
          bills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{bill.bill_number}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(0, bill.billing_month - 1).toLocaleString('default', {month: 'long'})} {bill.billing_year} • Room {bill.rooms?.room_number}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`badge ${
                    bill.status === 'paid' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {bill.status === 'paid' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paid
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {bill.room_rent > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Room Rent</p>
                    <p className="font-medium">₹{parseFloat(bill.room_rent).toLocaleString()}</p>
                  </div>
                )}
                {bill.electricity_charges > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Electricity</p>
                    <p className="font-medium">₹{parseFloat(bill.electricity_charges).toLocaleString()}</p>
                  </div>
                )}
                {bill.water_charges > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Water</p>
                    <p className="font-medium">₹{parseFloat(bill.water_charges).toLocaleString()}</p>
                  </div>
                )}
                {bill.maintenance_charges > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Maintenance</p>
                    <p className="font-medium">₹{parseFloat(bill.maintenance_charges).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-bold text-lg text-blue-600">₹{parseFloat(bill.total_amount).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                {bill.status === 'pending' ? (
                  <button
                    onClick={() => handlePayment(bill.id)}
                    disabled={paymentLoading}
                    className="btn-primary flex items-center disabled:opacity-50"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {paymentLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                ) : (
                  <button
                    onClick={() => downloadInvoice(bill.id)}
                    className="btn-secondary flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bills found</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-blue-600 hover:text-blue-500 mt-2"
              >
                View all bills
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;