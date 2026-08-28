import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI } from '../lib/ui';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons: AlertButton[];
  variant?: 'welcome' | 'default';
}

type Listener = (options: AlertOptions | null) => void;
const listeners: Listener[] = [];
let currentAlert: AlertOptions | null = null;

function notify() {
  listeners.forEach((l) => l(currentAlert));
}

export function showAlert(
  title: string,
  message?: string,
  buttons: AlertButton[] = [{ text: 'OK' }],
  variant: AlertOptions['variant'] = 'default'
) {
  currentAlert = { title, message, buttons, variant };
  notify();
}

export function showWelcomeAlert(firstName?: string) {
  const name = firstName?.trim();
  currentAlert = {
    title: name ? `Welcome, ${name}!` : 'Welcome to Growman',
    message: name
      ? 'Your account is all set. Browse plants, track orders, and get care tips — all in one place.'
      : 'Your account is all set. Browse plants, track orders, and get care tips on Growman.',
    buttons: [{ text: 'Start exploring' }],
    variant: 'welcome',
  };
  notify();
}

export function showConfirm(
  title: string,
  message: string,
  buttons: AlertButton[]
) {
  currentAlert = { title, message, buttons };
  notify();
}

function dismiss() {
  currentAlert = null;
  notify();
}

function isLogoutDialog(title: string, buttons: AlertButton[]) {
  const t = title.toLowerCase();
  return (
    (t.includes('logout') || t.includes('log out') || t.includes('sign out')) &&
    buttons.some((b) => b.style === 'destructive' || b.text.toLowerCase().includes('log out'))
  );
}

function getIconMeta(title: string, buttons: AlertButton[], variant?: AlertOptions['variant']) {
  if (variant === 'welcome') {
    return { name: 'eco' as const, bg: 'rgba(5, 150, 105, 0.14)', color: UI.color.primaryDark };
  }
  const t = title.toLowerCase();
  if (isLogoutDialog(title, buttons)) {
    return { name: 'logout' as const, bg: 'rgba(5, 150, 105, 0.12)', color: UI.color.primaryDark };
  }
  if (t.includes('error') || t.includes('failed')) {
    return { name: 'error-outline' as const, bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' };
  }
  if (t.includes('success')) {
    return { name: 'check-circle' as const, bg: 'rgba(5, 150, 105, 0.12)', color: UI.color.primary };
  }
  if (t.includes('scan') || t.includes('camera') || t.includes('choose')) {
    return { name: 'photo-camera' as const, bg: 'rgba(5, 150, 105, 0.12)', color: UI.color.primaryDark };
  }
  if (t.includes('microphone') || t.includes('speech')) {
    return { name: 'mic' as const, bg: 'rgba(5, 150, 105, 0.12)', color: UI.color.primaryDark };
  }
  return { name: 'info-outline' as const, bg: 'rgba(5, 150, 105, 0.1)', color: UI.color.primaryDark };
}

function isSheetConfirm(buttons: AlertButton[]) {
  return buttons.length >= 2 && buttons.some((b) => b.style === 'cancel');
}

export function AlertContainer() {
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const listener: Listener = (opts) => setOptions(opts);
    listeners.push(listener);
    if (currentAlert) setOptions(currentAlert);
    return () => {
      const i = listeners.indexOf(listener);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);

  if (!options) return null;

  const handlePress = (button: AlertButton) => {
    dismiss();
    button.onPress?.();
  };

  const handleBackdrop = () => {
    const cancel = options.buttons.find((b) => b.style === 'cancel');
    if (cancel) handlePress(cancel);
    else dismiss();
  };

  const icon = getIconMeta(options.title, options.buttons, options.variant);
  const sheet = isSheetConfirm(options.buttons) || options.variant === 'welcome';
  const logout = isLogoutDialog(options.title, options.buttons);
  const welcome = options.variant === 'welcome';

  const renderButton = (btn: AlertButton, layout: 'sheet' | 'stack') => {
    const isCancel = btn.style === 'cancel';
    const isDestructive = btn.style === 'destructive';
    const sheetFlex = layout === 'sheet' ? 'flex-1' : 'w-full';

    if (isCancel) {
      return (
        <TouchableOpacity
          key={btn.text}
          onPress={() => handlePress(btn)}
          activeOpacity={0.85}
          className={`${sheetFlex} items-center justify-center rounded-2xl border border-gray-200 bg-white py-3.5`}
          style={{
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}>
          <Text className="text-[15px] font-semibold text-gray-800">{btn.text}</Text>
        </TouchableOpacity>
      );
    }

    if (isDestructive && logout) {
      return (
        <TouchableOpacity
          key={btn.text}
          onPress={() => handlePress(btn)}
          activeOpacity={0.88}
          className={`${sheetFlex} items-center justify-center rounded-2xl py-3.5`}
          style={{ backgroundColor: UI.color.ink }}>
          <Text className="text-[15px] font-semibold text-white">{btn.text}</Text>
        </TouchableOpacity>
      );
    }

    if (isDestructive) {
      return (
        <TouchableOpacity
          key={btn.text}
          onPress={() => handlePress(btn)}
          activeOpacity={0.85}
          className={`${sheetFlex} items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-3.5`}>
          <Text className="text-[15px] font-semibold text-red-700">{btn.text}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={btn.text}
        onPress={() => handlePress(btn)}
        activeOpacity={0.88}
        className={`${sheetFlex} items-center justify-center rounded-2xl py-3.5`}
        style={{ backgroundColor: UI.color.primary }}>
        <Text className="text-[15px] font-semibold text-white">{btn.text}</Text>
      </TouchableOpacity>
    );
  };

  if (sheet) {
    return (
      <Modal visible transparent animationType="slide" onRequestClose={handleBackdrop}>
        <Pressable className="flex-1 justify-end" onPress={handleBackdrop}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-3xl bg-white px-5 pt-3"
            style={{
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 24,
            }}>
            <View className="mb-5 items-center">
              <View className="mb-4 h-1 w-10 rounded-full bg-gray-200" />
              {welcome ? (
                <View
                  className="mb-4 h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: icon.bg }}>
                  <MaterialIcons name={icon.name} size={34} color={icon.color} />
                </View>
              ) : (
                <View
                  className="mb-4 h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: icon.bg }}>
                  <MaterialIcons name={icon.name} size={28} color={icon.color} />
                </View>
              )}
              <Text
                className="text-center text-xl"
                style={{ fontFamily: UI.font.display, color: UI.color.ink }}>
                {options.title}
              </Text>
              {options.message ? (
                <Text className="mt-2 px-2 text-center text-[15px] leading-[22px] text-gray-600">
                  {options.message}
                </Text>
              ) : null}
              {welcome ? (
                <Text
                  className="mt-3 text-center text-[13px]"
                  style={{ fontFamily: UI.font.displayItalic, color: UI.color.primaryDark }}>
                  Happy growing.
                </Text>
              ) : null}
            </View>

            <View className={welcome ? 'gap-3' : 'flex-row gap-3'}>
              {options.buttons.map((btn) => renderButton(btn, welcome ? 'stack' : 'sheet'))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleBackdrop}>
      <Pressable className="flex-1 items-center justify-center bg-black/45 px-6" onPress={handleBackdrop}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm overflow-hidden rounded-3xl bg-white"
          style={{
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 12,
          }}>
          <View className="px-6 pb-6 pt-7">
            <View className="mb-5 items-center">
              <View
                className="mb-4 h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: icon.bg }}>
                <MaterialIcons name={icon.name} size={28} color={icon.color} />
              </View>
              <Text
                className="text-center text-xl"
                style={{ fontFamily: UI.font.display, color: UI.color.ink }}>
                {options.title}
              </Text>
              {options.message ? (
                <Text className="mt-2 text-center text-[15px] leading-[22px] text-gray-600">
                  {options.message}
                </Text>
              ) : null}
            </View>

            <View className="gap-3">
              {options.buttons.map((btn) => renderButton(btn, 'stack'))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
