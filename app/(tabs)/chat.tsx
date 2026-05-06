import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Route exists so the Chat tab appears in the tab bar.
 * Navigation to this screen is prevented in `(tabs)/_layout`; opening Dootha uses `openChatbot()` instead.
 */
export default function ChatTabScreen() {
  const insets = useSafeAreaInsets();
  return <View className="flex-1 bg-white" style={{ paddingBottom: insets.bottom }} />;
}
