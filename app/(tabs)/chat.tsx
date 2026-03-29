import { View } from 'react-native';

/**
 * Route exists so the Chat tab appears in the tab bar.
 * Navigation to this screen is prevented in `(tabs)/_layout`; opening Dootha uses `openChatbot()` instead.
 */
export default function ChatTabScreen() {
  return <View className="flex-1" />;
}
