import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons: AlertButton[];
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
  buttons: AlertButton[] = [{ text: 'OK' }]
) {
  currentAlert = { title, message, buttons };
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

function getIconForTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('error') || t.includes('failed')) return 'error';
  if (t.includes('success')) return 'check-circle';
  if (t.includes('logout') || t.includes('delete')) return 'logout';
  if (t.includes('permission') || t.includes('camera') || t.includes('microphone')) return 'info';
  if (t.includes('empty') || t.includes('cart')) return 'shopping-cart';
  if (t.includes('scan') || t.includes('choose')) return 'photo-camera';
  return 'info';
}

function getIconColor(buttons: AlertButton[]): string {
  const hasDestructive = buttons.some((b) => b.style === 'destructive');
  if (hasDestructive) return '#EF4444';
  return '#059669';
}

export function AlertContainer() {
  const [options, setOptions] = useState<AlertOptions | null>(null);

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

  const iconName = getIconForTitle(options.title) as any;
  const iconColor = getIconColor(options.buttons);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        const cancel = options.buttons.find((b) => b.style === 'cancel');
        if (cancel) handlePress(cancel);
        else dismiss();
      }}
    >
      <Pressable
        className="flex-1 justify-center items-center bg-black/50 px-6"
        onPress={() => {
          const cancel = options.buttons.find((b) => b.style === 'cancel');
          if (cancel) handlePress(cancel);
        }}
      >
        <Pressable
          className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="p-6 pt-7">
            <View className="items-center mb-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${iconColor}15` }}
              >
                <MaterialIcons name={iconName} size={28} color={iconColor} />
              </View>
              <Text className="text-xl font-bold text-gray-900 text-center">
                {options.title}
              </Text>
              {options.message ? (
                <Text className="text-base text-gray-600 text-center mt-2 leading-6">
                  {options.message}
                </Text>
              ) : null}
            </View>

            <View className="gap-3 mt-2">
              {options.buttons.map((btn) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={btn.text}
                    onPress={() => handlePress(btn)}
                    className={`py-3.5 rounded-xl flex-row items-center justify-center ${
                      isDestructive
                        ? 'bg-red-50'
                        : isCancel
                          ? 'bg-gray-100'
                          : 'bg-green-600'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        isDestructive
                          ? 'text-red-600'
                          : isCancel
                            ? 'text-gray-700'
                            : 'text-white'
                      }`}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
