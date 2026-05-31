/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'NoorWidget',
  icon: '../../assets/icons/icon.png',
  colors: {
    // Krem/altın marka renkleri — widget arka planı + aksanlar
    $accent: '#C9963A',
    $widgetBackground: '#F2EDE4',
  },
  entitlements: {
    'com.apple.security.application-groups': ['group.com.noor.app'],
  },
};
