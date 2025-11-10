const crypto = require('crypto');

const generateStayKey = () => {
  return 'STAY' + crypto.randomBytes(8).toString('hex').toUpperCase();
};

const generateRegistrationId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REG${timestamp}${random}`;
};

const generateBillNumber = (adminId, month, year) => {
  const shortId = adminId.slice(-4).toUpperCase();
  const monthStr = month.toString().padStart(2, '0');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BILL${year}${monthStr}${shortId}${random}`;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  generateStayKey,
  generateRegistrationId,
  generateBillNumber,
  generateOTP
};