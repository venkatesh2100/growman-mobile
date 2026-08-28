const appJson = require('./app.json');
const { withGradleProperties, withAppBuildGradle } = require('expo/config-plugins');

/**
 * Wires up release signing with the real keystore instead of the RN template's
 * default (which signs release builds with the debug key). Reads credentials from
 * .env so nothing secret is hardcoded, and re-applies on every prebuild since
 * android/ is regenerated from scratch on `expo prebuild --clean`.
 */
function withAndroidReleaseSigning(config) {
  const storeFile = (process.env.ANDROID_RELEASE_STORE_FILE || '').trim();
  const storePassword = (process.env.ANDROID_RELEASE_STORE_PASSWORD || '').trim();
  const keyAlias = (process.env.ANDROID_RELEASE_KEY_ALIAS || '').trim();
  const keyPassword = (process.env.ANDROID_RELEASE_KEY_PASSWORD || '').trim();

  if (!storeFile || !storePassword || !keyAlias || !keyPassword) {
    console.warn(
      '[withAndroidReleaseSigning] ANDROID_RELEASE_* env vars not set — release builds will fall back to debug signing.'
    );
    return config;
  }

  config = withGradleProperties(config, (config) => {
    const keys = new Set([
      'MYAPP_RELEASE_STORE_FILE',
      'MYAPP_RELEASE_STORE_PASSWORD',
      'MYAPP_RELEASE_KEY_ALIAS',
      'MYAPP_RELEASE_KEY_PASSWORD',
    ]);
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && keys.has(item.key))
    );
    config.modResults.push(
      { type: 'property', key: 'MYAPP_RELEASE_STORE_FILE', value: storeFile },
      { type: 'property', key: 'MYAPP_RELEASE_STORE_PASSWORD', value: storePassword },
      { type: 'property', key: 'MYAPP_RELEASE_KEY_ALIAS', value: keyAlias },
      { type: 'property', key: 'MYAPP_RELEASE_KEY_PASSWORD', value: keyPassword }
    );
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Add a release signingConfig alongside the template's debug one.
    const debugSigningConfig = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;
    const withReleaseSigningConfig = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }`;
    if (contents.includes(debugSigningConfig)) {
      contents = contents.replace(debugSigningConfig, withReleaseSigningConfig);
    }

    // Point the release build type at the release signingConfig instead of debug's.
    contents = contents.replace(
      /(release\s*\{\s*(?:\/\/[^\n]*\n\s*)*)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release'
    );

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

/** Dynamic Expo config so Truecaller client id can come from .env at prebuild time. */
module.exports = () => {
  let expo = { ...appJson.expo };
  const clientId = (process.env.EXPO_PUBLIC_TRUECALLER_ANDROID_CLIENT_ID || '').trim();

  expo.plugins = (expo.plugins || []).map((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    if (name === 'expo-truecaller') {
      return [
        'expo-truecaller',
        {
          androidClientId: clientId,
        },
      ];
    }
    return plugin;
  });

  expo = withAndroidReleaseSigning(expo);

  return { expo };
};
