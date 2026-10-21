const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('md', 'jsonl');
config.transformer.babelTransformerPath = require.resolve('./src/assistant/markdown-transformer.cjs');
module.exports = config;
