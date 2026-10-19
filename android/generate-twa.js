const { TwaManifest, TwaGenerator, ConsoleLog } = require('@bubblewrap/core');
(async () => {
  const m = new TwaManifest({
    packageId: 'io.github.salimadour31boop.ostadriyadiyat', host: 'salimadour31-boop.github.io', name: 'أستاذ الرياضيات – Ostad Riyadiyat', launcherName: 'أستاذ الرياضيات',
    display: 'standalone', themeColor: '#0f6b5c', navigationColor: '#0f6b5c', navigationColorDark: '#0f6b5c', navigationDividerColor: '#0f6b5c', navigationDividerColorDark: '#0f6b5c', backgroundColor: '#ffffff', enableNotifications: false,
    startUrl: '/ostad-riyadiyat/', iconUrl: 'https://salimadour31-boop.github.io/ostad-riyadiyat/icons/icon-512.png', maskableIconUrl: undefined,
    splashScreenFadeOutDuration: 300, signingKey: { path: '/home/box/keys/ostad-riyadiyat/keystore.jks', alias: 'ostad' }, appVersionName: '2.1.0', appVersion: '2.1.0', appVersionCode: 210,
    shortcuts: [], generatorApp: 'bubblewrap-core', webManifestUrl: new URL('https://salimadour31-boop.github.io/ostad-riyadiyat/manifest.webmanifest'), fallbackType: 'customtabs', features: {}, alphaDependencies: { enabled: false }, enableSiteSettingsShortcut: true, isChromeOSOnly: false, isMetaQuest: false, fullScopeUrl: new URL('https://salimadour31-boop.github.io/ostad-riyadiyat/'), minSdkVersion: 24, orientation: 'default', fingerprints: [], additionalTrustedOrigins: [], retainedBundles: [], protocolHandlers: [], fileHandlers: [], launchHandlerClientMode: '', displayOverride: [] });
  await m.saveToFile('proj/twa-manifest.json');
  await new TwaGenerator().createTwaProject('proj', m, new ConsoleLog('gen'));
  console.log('GEN OK');
})().catch(e => { console.error('ERR', e); process.exit(1); });
