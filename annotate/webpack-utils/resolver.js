const fs = require('fs');
const path = require('path');

// This is a custom resolver for webpack that will intercept specific module requests
function createResolver(options) {
  return (req, context, callback) => {
    // Debug the request object structure
    // console.log('Request:', req);
    
    // Check if the request object has a request property (which is the module path)
    const requestPath = req.request || req.path || String(req);
    
    // Specifically intercept the html-webpack-plugin loader request that's failing
    if (typeof requestPath === 'string' && requestPath.indexOf('html-webpack-plugin/lib/loader') >= 0) {
      // Return our mock loader instead
      const mockLoaderPath = path.resolve(__dirname, '../helpers/loader-shim.js');
      if (fs.existsSync(mockLoaderPath)) {
        return callback(null, {
          path: mockLoaderPath,
          query: '',
          resolved: true
        });
      }
    }
    // For all other requests, continue with normal resolution
    callback();
  };
}

module.exports = { createResolver };
