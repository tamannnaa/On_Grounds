const debug = require('debug');

const createDebugMiddleware = (namespace) => {
  const debugLog = debug(namespace);
  
  return (req, res, next) => {
    debugLog(`${req.method} ${req.url}`);
    
    if (Object.keys(req.body).length > 0) {
      debugLog('Request body:', req.body);
    }
    
    if (req.params && Object.keys(req.params).length > 0) {
      debugLog('Request params:', req.params);
    }
    
    if (req.query && Object.keys(req.query).length > 0) {
      debugLog('Query params:', req.query);
    }
    
    next();
  };
};

module.exports = {
  createDebugMiddleware
};