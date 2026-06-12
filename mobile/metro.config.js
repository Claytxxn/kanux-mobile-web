// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for missing metroServerLogs and promiseRejectionTracking modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub missing internal modules
  if (moduleName === './metroServerLogs') {
    return {
      filePath: path.join(__dirname, 'node_modules', '@expo', 'metro-runtime', 'src', 'metroServerLogs.ts'),
      type: 'sourceFile',
    };
  }
  
  if (moduleName === './promiseRejectionTracking') {
    return {
      filePath: path.join(__dirname, 'node_modules', '@expo', 'metro-runtime', 'src', 'promiseRejectionTracking.ts'),
      type: 'sourceFile',
    };
  }

  if (moduleName === './src/error-overlay') {
    return {
      filePath: path.join(__dirname, 'node_modules', '@expo', 'metro-runtime', 'src', 'error-overlay', 'index.ts'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'react-native-safe-area-context') {
    return {
      filePath: path.join(__dirname, 'node_modules', 'react-native-safe-area-context', 'lib', 'commonjs', 'index.js'),
      type: 'sourceFile',
    };
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
