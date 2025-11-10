const logInfo = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

const logError = (message, error = null) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${message}`, error ? error.stack || error : '');
};

const logSuccess = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

const logWarning = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] ⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

module.exports = {
  logInfo,
  logError,
  logSuccess,
  logWarning
};