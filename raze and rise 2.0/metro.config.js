// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add json to assetExts so Lottie JSON files are bundled as binary assets.
config.resolver.assetExts.push('json');

module.exports = withNativeWind(config, { input: './global.css' });
