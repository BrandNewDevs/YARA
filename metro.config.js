const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('md', 'jsonl');
config.transformer.babelTransformerPath = require.resolve('./src/assistant/markdown-transformer.cjs');
// expo-sqlite on web: wasm asset, and cross-origin isolation headers for its worker.
config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};
module.exports = config;
