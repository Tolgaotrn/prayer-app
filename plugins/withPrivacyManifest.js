const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Copies PrivacyInfo.xcprivacy into the iOS project root so Apple's
 * privacy manifest requirement is satisfied for App Store review.
 */
const withPrivacyManifest = (config) =>
  withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const src = path.resolve(__dirname, '..', 'PrivacyInfo.xcprivacy');
      const dest = path.join(cfg.modRequest.platformProjectRoot, 'PrivacyInfo.xcprivacy');
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
      return cfg;
    },
  ]);

module.exports = withPrivacyManifest;
