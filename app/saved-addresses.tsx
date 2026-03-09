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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '../components/Loading';
import { toast } from '../components/Toast';
import { apiFetch } from '../lib/api';
import { getAllStateNames } from '../lib/data/indianStatesCities';
import { useAuthStore } from '../store/authStore';
import SelectField from '../components/SelectField';

export default function SavedAddressesScreen() {
  const insets = useSafeAreaInsets();
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
      <View className="flex-1 bg-gray-50 justify-center items-center" style={{ paddingTop: insets.top }}>
        <Text className="text-gray-600 mb-4">Please login to manage addresses</Text>
        <TouchableOpacity className="bg-green-600 px-6 py-3 rounded-xl" onPress={() => router.replace('/(auth)/login')}>
          <Text className="text-white font-semibold">Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <Loading />;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">Saved Addresses</Text>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Address Line *</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-base"
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
              className="border border-gray-300 rounded-xl px-4 py-3 text-base"
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
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Pincode *</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-base"
              value={address.pincode}
              onChangeText={(t) => setAddress({ ...address, pincode: t.replace(/\D/g, '').slice(0, 6) })}
              placeholder="6-digit pincode"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <TouchableOpacity
            className="bg-green-600 py-4 rounded-xl flex-row items-center justify-center"
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">Save Address</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
