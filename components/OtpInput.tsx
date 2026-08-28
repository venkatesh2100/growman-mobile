import React, { useEffect, useRef } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { UI } from '../lib/ui';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  hasError?: boolean;
};

export function OtpInput({ value, onChange, length = 6, autoFocus, hasError }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const activeIndex = value.length < length ? value.length : length - 1;

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(focusInput, 400);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  return (
    <View className="mb-6">
      <View className="relative">
        <View className="flex-row justify-center gap-2" pointerEvents="none">
          {digits.map((digit, index) => {
            const isActive = index === activeIndex;
            const isFilled = digit.length > 0;

            return (
              <View
                key={index}
                className={`flex-1 max-w-[52px] aspect-[5/6] items-center justify-center rounded-xl border-2 bg-white ${
                  hasError
                    ? 'border-red-300'
                    : isActive
                      ? 'border-emerald-600'
                      : isFilled
                        ? 'border-emerald-200'
                        : 'border-gray-200'
                }`}
                style={isActive && !hasError ? { borderColor: UI.color.primary } : undefined}>
                <Text className="text-2xl font-bold text-gray-900">{digit}</Text>
              </View>
            );
          })}
        </View>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
          onPressIn={focusInput}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={length}
          autoFocus={autoFocus}
          autoComplete={length === 6 ? 'one-time-code' : 'off'}
          textContentType="oneTimeCode"
          importantForAutofill="yes"
          showSoftInputOnFocus
          caretHidden
          selectTextOnFocus={false}
          contextMenuHidden
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            fontSize: 24,
            color: 'transparent',
            backgroundColor: 'transparent',
            ...(Platform.OS === 'android' ? { opacity: 0.02 } : {}),
          }}
        />
      </View>
    </View>
  );
}
