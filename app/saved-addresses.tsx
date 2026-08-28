import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Loading from '../components/Loading';
import ScreenHeader from '../components/ScreenHeader';
import SelectField from '../components/SelectField';
import { toast } from '../components/Toast';
import { apiFetch } from '../lib/api';
import { getAllStateNames } from '../lib/data/indianStatesCities';
import { UI } from '../lib/ui';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';

const inputClass = 'rounded-xl px-4 py-3 text-base text-gray-900';
const inputStyle = { borderWidth: 1, borderColor: UI.color.border, backgroundColor: UI.color.surface };

export default function SavedAddressesScreen() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState({
    line: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  useEffect(() => {
    if (token) {
      loadAddress();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadAddress = async () => {
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          setAddress({
            line: data.address.line || '',
            city: data.address.city || '',
            state: data.address.state || '',
            pincode: data.address.pincode || '',
            country: data.address.country || 'India',
          });
        }
      }
    } catch (error) {
      console.error('Error loading address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!address.line.trim()) {
      toast('Please enter address line', 'error');
      return;
    }
    if (!address.city.trim()) {
      toast('Please enter city', 'error');
      return;
    }
    if (!address.state.trim()) {
      toast('Please select state', 'error');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(address.pincode)) {
      toast('Please enter valid 6-digit pincode', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          addressLine: address.line,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        }),
      });
      if (res.ok) {
        toast('Address saved successfully', 'success');
        await useUserStore.getState().loadUser();
      } else {
        const err = await res.json().catch(() => ({}));
        toast((err as { error?: string })?.error || 'Failed to save', 'error');
      }
    } catch (error) {
      toast('Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <View className="flex-1 justify-center items-center px-8" style={{ backgroundColor: UI.color.canvasAlt }}>
        <Text className="text-gray-600 mb-4 text-center">Please login to manage addresses</Text>
        <TouchableOpacity
          className="px-6 py-3 rounded-xl"
          style={{ backgroundColor: UI.color.primary }}
          onPress={() => router.replace('/(auth)/login')}>
          <Text className="text-white font-semibold">Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <Loading />;

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <ScreenHeader title="Saved addresses" />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: UI.color.border }}>
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Address line *</Text>
            <TextInput
              className={inputClass}
              style={inputStyle}
              value={address.line}
              onChangeText={(t) => setAddress({ ...address, line: t })}
              placeholder="House/Flat No., Building, Street"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">City *</Text>
            <TextInput
              className={inputClass}
              style={inputStyle}
              value={address.city}
              onChangeText={(t) => setAddress({ ...address, city: t })}
              placeholder="City"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">State *</Text>
            <SelectField
              value={address.state}
              onValueChange={(v) => setAddress({ ...address, state: v })}
              options={[{ label: 'Select State', value: '' }, ...getAllStateNames().map((s) => ({ label: s, value: s }))]}
              placeholder="Select State"
            />
          </View>
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Pincode *</Text>
            <TextInput
              className={inputClass}
              style={inputStyle}
              value={address.pincode}
              onChangeText={(t) => setAddress({ ...address, pincode: t.replace(/\D/g, '').slice(0, 6) })}
              placeholder="6-digit pincode"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <TouchableOpacity
            className="py-3.5 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: UI.color.primaryDark }}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">Save address</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
