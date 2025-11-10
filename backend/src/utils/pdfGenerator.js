const PDFDocument = require('pdfkit');

const generateInvoicePDF = async (billData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header with Branding
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#2563eb').text('NESTIFY', 50, 50);
      doc.fontSize(14).fillColor('#6b7280').text('Hostel Management System', 50, 85);
      doc.fontSize(20).fillColor('#1f2937').text('INVOICE', 400, 50);
      
      // Hostel Details
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937').text(billData.admins?.hostel_name || 'Nestify Hostel', 50, 130);
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text(billData.admins?.hostel_address || 'Hostel Address', 50, 150);
      doc.text(`Phone: ${billData.admins?.phone || '+91 98765 43210'}`, 50, 165);
      doc.text(`Email: ${billData.admins?.email || 'info@nestify.com'}`, 50, 180);

      // Invoice Details Box
      doc.rect(400, 130, 150, 80).stroke();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1f2937').text('Invoice Number:', 410, 140);
      doc.font('Helvetica').text(billData.bill_number, 410, 155);
      doc.font('Helvetica-Bold').text('Invoice Date:', 410, 175);
      doc.font('Helvetica').text(new Date(billData.created_at).toLocaleDateString('en-IN'), 410, 190);

      // Tenant Details
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937').text('Bill To:', 50, 240);
      doc.fontSize(12).font('Helvetica').text(`Name: ${billData.tenants?.name || 'Tenant Name'}`, 50, 260);
      doc.text(`Room Number: ${billData.rooms?.room_number || 'N/A'}`, 50, 280);
      doc.text(`Student ID: ${billData.tenants?.registration_id || 'N/A'}`, 50, 300);
      doc.text(`Contact: ${billData.tenants?.phone || 'N/A'}`, 50, 320);

      // Charges Table
      const tableTop = 370;
      doc.rect(50, tableTop, 500, 25).fillAndStroke('#f3f4f6', '#e5e7eb');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1f2937');
      doc.text('S.No', 60, tableTop + 8);
      doc.text('Description', 100, tableTop + 8);
      doc.text('Quantity', 300, tableTop + 8);
      doc.text('Rate (₹)', 380, tableTop + 8);
      doc.text('Amount (₹)', 460, tableTop + 8);

      let yPosition = tableTop + 35;
      let sno = 1;
      const charges = [
        { desc: 'Room Rent', amount: billData.room_rent, qty: '1 Month', rate: billData.room_rent },
        { desc: 'Electricity Charges', amount: billData.electricity_charges, qty: '1 Month', rate: billData.electricity_charges },
        { desc: 'Water Charges', amount: billData.water_charges, qty: '1 Month', rate: billData.water_charges },
        { desc: 'Maintenance Charges', amount: billData.maintenance_charges, qty: '1 Month', rate: billData.maintenance_charges },
        { desc: 'Internet/Wi-Fi Charges', amount: billData.internet_charges, qty: '1 Month', rate: billData.internet_charges },
        { desc: 'Other Charges', amount: billData.other_charges, qty: '1 Month', rate: billData.other_charges }
      ];

      doc.fontSize(10).font('Helvetica').fillColor('#374151');
      charges.forEach((charge) => {
        if (parseFloat(charge.amount || 0) > 0) {
          doc.text(sno.toString(), 60, yPosition);
          doc.text(charge.desc, 100, yPosition);
          doc.text(charge.qty, 300, yPosition);
          doc.text(parseFloat(charge.rate).toFixed(2), 380, yPosition);
          doc.text(parseFloat(charge.amount).toFixed(2), 460, yPosition);
          yPosition += 20;
          sno++;
        }
      });

      // Total Section
      doc.rect(350, yPosition + 10, 200, 25).fillAndStroke('#2563eb', '#2563eb');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('white');
      doc.text('Total Amount (₹)', 360, yPosition + 18);
      doc.text(parseFloat(billData.total_amount).toFixed(2), 460, yPosition + 18);

      // Payment Summary
      if (billData.transactions) {
        const transaction = billData.transactions;
        const paymentMode = transaction.payment_method === 'razorpay' ? 'UPI/Card/Net Banking' : 
                           transaction.payment_method === 'cash' ? 'Cash' : 
                           transaction.payment_method || 'UPI/Card/Net Banking';
        
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937').text('Payment Summary', 50, yPosition + 60);
        doc.fontSize(10).font('Helvetica').fillColor('#374151');
        doc.text(`Payment Mode: ${paymentMode}`, 50, yPosition + 85);
        doc.text(`Transaction ID: ${transaction.razorpay_payment_id || transaction.transaction_reference || 'CASH-' + billData.bill_number}`, 50, yPosition + 100);
        doc.text(`Payment Date: ${new Date(transaction.transaction_date || billData.created_at).toLocaleDateString('en-IN')}`, 50, yPosition + 115);
        doc.text('Payment Status: Paid ✅', 50, yPosition + 130);
      }

      // Remarks
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1f2937').text('Remarks / Notes', 50, yPosition + 170);
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
      doc.text('• Kindly retain this invoice for your records.', 50, yPosition + 190);
      doc.text('• Rent must be paid on or before the 5th of every month.', 50, yPosition + 205);
      doc.text('• Contact the warden for billing or maintenance issues.', 50, yPosition + 220);

      // Footer
      doc.fontSize(8).fillColor('#9ca3af').text('Generated by Nestify Hostel Management System © 2025', 50, 750);
      doc.text('Visit: www.nestify.in', 400, 750);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };