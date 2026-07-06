const path = require('path');

// Set up module resolution for pnpm symlinked node_modules
const serverNodeModules = path.join(__dirname, 'server-node-modules');
const serverNodeModules2 = path.join(__dirname, '..', 'server', 'node_modules');
const rootServerModules = path.join(__dirname, '..', '..', 'server', 'node_modules');
const rootModules = path.join(__dirname, '..', '..', 'node_modules');

// Add all possible node_modules paths
module.paths.unshift(
  serverNodeModules,
  serverNodeModules2,
  rootServerModules,
  rootModules
);

// Also patch require.resolve
const origResolve = require.resolve;
require.resolve = function(mod, opts) {
  try { return origResolve(mod, opts); } catch(e) {}
  try { return origResolve(mod, { ...opts, paths: [serverNodeModules, serverNodeModules2, rootServerModules, rootModules] }); } catch(e) {}
  throw e;
};

require('reflect-metadata');

let appPromise = null;

function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { createApp } = require(path.join(__dirname, '..', 'server', 'dist', 'src', 'main.js'));
      const nestApp = await createApp();
      await nestApp.init();
      const expressApp = nestApp.getHttpAdapter().getInstance();
      console.log('NestJS initialized for serverless');
      return expressApp;
    })();
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    
    // Log for debugging (remove after confirming it works)
    console.log('Request URL:', req.url, 'Method:', req.method);
    
    return app(req, res);
  } catch (err) {
    console.error('Handler error:', err.message, err.stack);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
};
