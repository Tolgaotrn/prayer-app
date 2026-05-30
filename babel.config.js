// Replaces every `import.meta` reference with an empty object so the classic
// (non-module) web bundle can parse. Some deps (e.g. zustand devtools) use
// `import.meta.env`, which is a SyntaxError in a classic <script>. Harmless on
// native too (the `import.meta.env ? ... : void 0` checks just take the void 0
// branch). The published babel-plugin-transform-import-meta only handles
// `import.meta.url`, so we use this small inline visitor instead.
function transformImportMeta() {
  return {
    name: 'inline-transform-import-meta',
    visitor: {
      MetaProperty(path) {
        const node = path.node;
        if (node.meta && node.meta.name === 'import' && node.property.name === 'meta') {
          path.replaceWithSourceString('({})');
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      transformImportMeta,
      // react-native-reanimated/plugin MUST be listed last.
      'react-native-reanimated/plugin',
    ],
  };
};
