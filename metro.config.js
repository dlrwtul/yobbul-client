const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @expo/vector-icons is nested inside expo's own node_modules.
// Expose it at the top-level so any file can import it directly.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@expo/vector-icons': path.resolve(
    __dirname,
    'node_modules/expo/node_modules/@expo/vector-icons'
  ),
};

module.exports = config;
