import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from '../components/Toast';
import { apiFetch } from '../lib/api';
import { getAllStateNames, indianStates } from '../lib/data/indianStatesCities';
import { getCurrentLocation } from '../lib/utils/geolocation';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export default function CheckoutScreen() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserAddress();
      setOtpVerified(true);
    } else {
      setOtpVerified(false);
      setOtpSent(false);
      setOtp('');
    }
  }, [isAuthenticated]);

  const loadUserAddress = async () => {
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          setCustomerInfo({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            addressLine: data.address.line || '',
            city: data.address.city || '',
            state: data.address.state || '',
            pincode: data.address.pincode || '',
            country: data.address.country || 'India',
          });
        }
      }
    } catch (error) {
      console.error('Error loading user address:', error);
    }
  };

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const locationData = await getCurrentLocation();

      let matchedState = '';
      if (locationData.state) {
        const stateMatch = indianStates.find(
          (state) =>
            state.name.toLowerCase().includes(locationData.state!.toLowerCase()) ||
            locationData.state!.toLowerCase().includes(state.name.toLowerCase())
        );
        if (stateMatch) {
          matchedState = stateMatch.name;
        }
      }

      const updatedInfo = {
        ...customerInfo,
        addressLine: locationData.addressLine || customerInfo.addressLine,
        city: locationData.city || customerInfo.city,
        state: matchedState || customerInfo.state,
        pincode: locationData.pincode || customerInfo.pincode,
        country: locationData.country || 'India',
      };

      setCustomerInfo(updatedInfo);

      if (isAuthenticated && locationData.latitude && locationData.longitude) {
        try {
          await apiFetch('/auth/save-location', {
            method: 'POST',
            body: JSON.stringify({
              addressLine: updatedInfo.addressLine,
              city: updatedInfo.city,
              state: updatedInfo.state,
              pincode: updatedInfo.pincode,
              country: updatedInfo.country,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            }),
          });
        } catch (error) {
          console.error('Error saving location:', error);
        }
      }
    } catch (error: unknown) {
      setError(`Failed to get location: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast(error instanceof Error ? error.message : 'Failed to get location', 'error');
    } finally {
      setLocating(false);
    }
  };

  const checkUserExists = async (email?: string, phone?: string) => {
    if (!email && !phone) return false;
    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (phone) params.append('phone', phone);

      const res = await apiFetch(`/auth/check-user?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists && !isAuthenticated) {
          setShowLoginPrompt(true);
          setError('An account with this email or phone already exists. Please login to continue.');
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
    return false;
  };

  const subtotal = getSubtotal();
  const discount: number = 0;
  const shipping: number = subtotal > 500 ? 0 : 0;
  const total: number = subtotal - discount + shipping;

  const handleSendOTP = async () => {
    if (isAuthenticated) {
      setOtpVerified(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.email.trim() || !emailRegex.test(customerInfo.email)) {
      setError('Please enter a valid email address');
      toast('Please enter a valid email address', 'error');
      return;
    }

    setSendingOtp(true);
    setError(null);

    try {
      const res = await apiFetch('/checkout/send-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email: customerInfo.email }),
      });

      if (!res.ok) {
        let errorMessage = 'Could not send OTP';
        try {
          const errorData = await res.json();
          if (errorData.error === 'user_exists') {
            setShowLoginPrompt(true);
            errorMessage = 'An account with this email already exists. Please login to continue.';
            toast(errorMessage, 'info');
            setError(errorMessage);
            return;
          }
          if (errorData.error) {
            if (errorData.error.includes('wait') || errorData.error.includes('rate limit')) {
              errorMessage = 'Too many requests. Please wait a minute before requesting another OTP.';
            } else {
              errorMessage = errorData.error;
            }
          }
        } catch {
          // If parsing fails, use default message
        }

        toast(errorMessage + '. You can skip verification and proceed to payment.', 'error');
        setError(errorMessage);
        return;
      }

      toast('Verification code sent to your email!', 'success');
      setOtpSent(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Could not send OTP. You can skip verification and proceed to payment.';
      toast(errorMsg, 'error');
      setError(errorMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      const errorMsg = 'Please enter a valid 6-digit OTP';
      toast(errorMsg, 'error');
      setError(errorMsg);
      return;
    }

    setVerifyingOtp(true);
    setError(null);

    try {
      const res = await apiFetch('/checkout/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email: customerInfo.email, otp }),
      });

      if (!res.ok) {
        let errorMessage = 'Invalid OTP';
        try {
          const errorData = await res.json();
          const apiError = errorData.error || errorData.message;
          if (apiError) {
            if (apiError.includes('expired')) {
              errorMessage = 'OTP has expired. Please request a new one.';
            } else if (apiError.includes('invalid') || apiError.includes('incorrect')) {
              errorMessage = 'Invalid OTP. Please check and try again.';
            } else {
              errorMessage = apiError;
            }
          }
        } catch {
          // If parsing fails, use default message
        }

        toast(errorMessage, 'error');
        throw new Error(errorMessage);
      }

      toast('Email verified successfully!', 'success');
      setOtpVerified(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid OTP. Please try again.';
      setError(errorMsg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    if (!customerInfo.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.email.trim() || !emailRegex.test(customerInfo.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!customerInfo.phone.trim() || !phoneRegex.test(customerInfo.phone)) {
      setError('Please enter a valid 10-digit phone number starting with 6-9');
      return false;
    }
    if (!customerInfo.addressLine.trim()) {
      setError('Please enter your address line');
      return false;
    }
    if (!customerInfo.city.trim()) {
      setError('Please enter your city');
      return false;
    }
    if (!customerInfo.state.trim()) {
      setError('Please select your state');
      return false;
    }
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!customerInfo.pincode.trim() || !pincodeRegex.test(customerInfo.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }

    if (!isAuthenticated) {
      const userExists = await checkUserExists(customerInfo.email, customerInfo.phone);
      if (userExists) {
        return false;
      }
    }

    return true;
  };

  const handlePayment = async () => {
    if (!isAuthenticated && !otpVerified) {
      setError('Please verify your email with OTP first');
      toast('Please verify your email with OTP first', 'error');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      const orderItems = items
        .filter((item) => item.productId && item.productId > 0)
        .map((item) => ({
          productId: item.productId,
          productSizeId: item.productSizeId,
          quantity: item.quantity,
          price: item.price,
        }));

      if (orderItems.length === 0) {
        setError('Invalid cart items. Please add items to cart again.');
        setPaymentStatus('failed');
        setLoading(false);
        return;
      }

      // Create Razorpay order from backend
      const orderRes = await apiFetch('/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          items: orderItems,
          customer: customerInfo,
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderRes.json();

      // For React Native, we'll use WebView or react-native-razorpay-checkout
      // For now, we'll show an alert and redirect to order success
      // In production, integrate with react-native-razorpay-checkout
      Alert.alert(
        'Payment',
        'Payment integration will be handled via Razorpay SDK. For now, redirecting to order success.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // In production, verify payment here
              setPaymentStatus('success');

              // Auto-save address if user entered new details and is not logged in
              if (!isAuthenticated && customerInfo.email) {
                try {
                  await apiFetch('/checkout/save-address', {
                    method: 'POST',
                    body: JSON.stringify({
                      email: customerInfo.email,
                      phone: customerInfo.phone,
                      name: customerInfo.name,
                      address: {
                        line: customerInfo.addressLine,
                        city: customerInfo.city,
                        state: customerInfo.state,
                        pincode: customerInfo.pincode,
                        country: customerInfo.country,
                      },
                    }),
                  });
                } catch (err) {
                  console.error('Error saving address:', err);
                }
              }

              // Clear cart
              clearCart();
              // Redirect to success page
              setTimeout(() => {
                router.push(`/order-success?orderId=${String(orderData.orderId)}` as any);
              }, 2000);
            },
          },
        ]
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMsg);
      setPaymentStatus('failed');
      toast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <MaterialIcons name="shopping-bag" size={64} color="#D1D5DB" />
        <Text className="text-2xl font-semibold text-gray-800 mb-2">Your cart is empty</Text>
        <Text className="text-base text-gray-600 mb-6 text-center">Add some plants to your cart to continue</Text>
        <TouchableOpacity
          className="bg-green-600 px-6 py-3 rounded-lg active:bg-green-700"
          onPress={() => router.push('/(tabs)/shop')}>
          <Text className="text-base font-medium text-white">Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Checkout</Text>

        {/* Customer Information Form */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-md">
          <View className="flex-row items-center mb-4">
            <MaterialIcons name="credit-card" size={20} color="#059669" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Customer Information</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Full Name *</Text>
              <TextInput
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg"
                value={customerInfo.name}
                onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Email Address *</Text>
              <TextInput
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg"
                value={customerInfo.email}
                onChangeText={async (text) => {
                  setCustomerInfo({ ...customerInfo, email: text });
                  if (text.includes('@') && !isAuthenticated) {
                    await checkUserExists(text, undefined);
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="john@example.com"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number *</Text>
              <TextInput
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg"
                value={customerInfo.phone}
                onChangeText={async (text) => {
                  const phone = text.replace(/\D/g, '').slice(0, 10);
                  setCustomerInfo({ ...customerInfo, phone });
                  if (phone.length === 10 && !isAuthenticated) {
                    await checkUserExists(undefined, phone);
                  }
                }}
                keyboardType="phone-pad"
                placeholder="9876543210"
                placeholderTextColor="#9CA3AF"
                maxLength={10}
              />
              <Text className="text-xs text-gray-500 mt-1">10 digits, starting with 6-9</Text>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Country</Text>
              <View className="border border-gray-300 rounded-lg">
                <Picker
                  selectedValue={customerInfo.country}
                  onValueChange={(value) => setCustomerInfo({ ...customerInfo, country: value })}>
                  <Picker.Item label="India" value="India" />
                </Picker>
              </View>
            </View>

            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-gray-700">
                  Address Line * (include Door No, Building Name, Street)
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-2"
                  onPress={handleLocateMe}
                  disabled={locating}>
                  {locating ? (
                    <>
                      <ActivityIndicator size="small" color="#059669" />
                      <Text className="text-sm text-green-600">Locating...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="my-location" size={16} color="#059669" />
                      <Text className="text-sm text-green-600 font-medium">Locate Me</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <TextInput
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg"
                value={customerInfo.addressLine}
                onChangeText={(text) => setCustomerInfo({ ...customerInfo, addressLine: text })}
                placeholder="House/Flat No., Building Name, Street"
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">State *</Text>
                <View className="border border-gray-300 rounded-lg">
                  <Picker
                    selectedValue={customerInfo.state}
                    onValueChange={(value) => setCustomerInfo({ ...customerInfo, state: value })}>
                    <Picker.Item label="Select State" value="" />
                    {getAllStateNames().map((state) => (
                      <Picker.Item key={state} label={state} value={state} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">City *</Text>
                <TextInput
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg"
                  value={customerInfo.city}
                  onChangeText={(text) => setCustomerInfo({ ...customerInfo, city: text })}
                  placeholder="Enter city name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Pincode *</Text>
              <TextInput
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg"
                value={customerInfo.pincode}
                onChangeText={(text) => setCustomerInfo({ ...customerInfo, pincode: text.replace(/\D/g, '').slice(0, 6) })}
                keyboardType="number-pad"
                placeholder="123456"
                placeholderTextColor="#9CA3AF"
                maxLength={6}
              />
              <Text className="text-xs text-gray-500 mt-1">6 digits, starting with 1-9</Text>
            </View>
          </View>
        </View>

        {/* Email OTP Verification - Only for non-logged-in users */}
        {!isAuthenticated && !otpVerified && (
          <View className="bg-white rounded-xl p-4 mb-4 border-2 border-green-200 shadow-md">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="mail" size={20} color="#059669" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Verify Email (Optional)</Text>
            </View>
            <Text className="text-sm text-gray-600 mb-4">
              Verify your email to receive order updates. You can skip this and proceed directly to payment.
            </Text>
            {!otpSent ? (
              <TouchableOpacity
                className="w-full bg-green-600 py-3 rounded-lg active:bg-green-700 flex-row items-center justify-center"
                onPress={handleSendOTP}
                disabled={sendingOtp || !customerInfo.email}>
                {sendingOtp ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-base font-semibold text-white ml-2">Sending OTP...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="mail" size={20} color="#FFFFFF" />
                    <Text className="text-base font-semibold text-white ml-2">
                      Send OTP to {customerInfo.email || 'your email'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</Text>
                  <TextInput
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    placeholder="000000"
                    placeholderTextColor="#9CA3AF"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  className="w-full bg-green-600 py-3 rounded-lg active:bg-green-700 flex-row items-center justify-center"
                  onPress={handleVerifyOTP}
                  disabled={verifyingOtp || otp.length !== 6}>
                  {verifyingOtp ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-base font-semibold text-white ml-2">Verifying...</Text>
                    </>
                  ) : (
                    <Text className="text-base font-semibold text-white">Verify OTP</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-full py-2"
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}>
                  <Text className="text-sm text-green-600 text-center">Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}
            {otpVerified && (
              <View className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex-row items-center">
                <MaterialIcons name="check-circle" size={20} color="#059669" />
                <Text className="text-sm text-green-700 ml-2">Email verified successfully!</Text>
              </View>
            )}
            <View className="mt-4 pt-4 border-t border-gray-200">
              <TouchableOpacity
                className="w-full py-2"
                onPress={() => {
                  setOtpVerified(true);
                }}>
                <Text className="text-sm text-gray-600 text-center underline">Skip verification and proceed to payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Show verification status for logged-in users */}
        {isAuthenticated && (
          <View className="bg-white rounded-xl p-4 mb-4 border-2 border-green-200 shadow-md">
            <View className="flex-row items-center">
              <MaterialIcons name="check-circle" size={20} color="#059669" />
              <View className="ml-2">
                <Text className="text-sm font-semibold text-gray-900">Email Verified</Text>
                <Text className="text-xs text-gray-600">You&apos;re logged in. No verification needed.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-md">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Order Items</Text>
          <View className="space-y-2">
            {items.map((item) => (
              <View key={item.id} className="flex-row items-center gap-3 p-2 border border-gray-200 rounded-lg">
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/60' }}
                  className="w-14 h-14 rounded object-cover"
                />
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{item.name}</Text>
                  {item.label && <Text className="text-sm text-gray-500">Size: {item.label}</Text>}
                  <Text className="text-sm text-gray-600">Quantity: {item.quantity}</Text>
                </View>
                <Text className="text-base font-semibold text-gray-900">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-xl p-4 shadow-md">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Order Summary</Text>
          <View className="space-y-2 mb-4">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-700">Items Price</Text>
              <Text className="text-sm text-gray-700">₹{subtotal.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-green-600 font-medium">Discount</Text>
                <Text className="text-sm text-green-600 font-medium">-₹{discount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-700">Delivery</Text>
              <Text className={`text-sm ${shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
              </Text>
            </View>
            <View className="border-t border-gray-300 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-gray-900">Total</Text>
                <Text className="text-lg font-bold text-gray-900">₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {error && (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex-row items-center">
              <MaterialIcons name="error" size={20} color="#EF4444" />
              <Text className="text-sm text-red-700 ml-2">{error}</Text>
            </View>
          )}

          {paymentStatus === 'success' && (
            <View className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex-row items-center">
              <MaterialIcons name="check-circle" size={20} color="#059669" />
              <Text className="text-sm text-green-700 ml-2">Payment successful! Redirecting...</Text>
            </View>
          )}

          <TouchableOpacity
            className="w-full bg-green-600 py-3 rounded-lg active:bg-green-700 flex-row items-center justify-center"
            onPress={handlePayment}
            disabled={loading || paymentStatus === 'processing' || (!isAuthenticated && !otpVerified)}>
            {loading || paymentStatus === 'processing' ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-base font-semibold text-white ml-2">Processing...</Text>
              </>
            ) : !isAuthenticated && !otpVerified ? (
              <Text className="text-base font-semibold text-white">Verify Email to Pay</Text>
            ) : (
              <>
                <MaterialIcons name="credit-card" size={20} color="#FFFFFF" />
                <Text className="text-base font-semibold text-white ml-2">Pay ₹{total.toFixed(2)}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 text-center mt-3">
            Secure payment powered by Razorpay
          </Text>
        </View>
      </View>

      {/* Login Prompt Modal */}
      <Modal visible={showLoginPrompt} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="login" size={24} color="#059669" />
              <Text className="text-xl font-semibold text-gray-900 ml-2">Account Already Exists</Text>
            </View>
            <Text className="text-gray-600 mb-6">
              An account with this email already exists. Please login to continue with your order.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-green-600 py-3 rounded-lg active:bg-green-700 flex-row items-center justify-center"
                onPress={() => {
                  router.push(`/(auth)/login?email=${encodeURIComponent(customerInfo.email)}&phone=${encodeURIComponent(customerInfo.phone)}&redirect=/checkout`);
                }}>
                <MaterialIcons name="login" size={20} color="#FFFFFF" />
                <Text className="text-base font-semibold text-white ml-2">Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-3 border border-gray-300 rounded-lg active:bg-gray-50"
                onPress={() => {
                  setShowLoginPrompt(false);
                  setError(null);
                }}>
                <Text className="text-base font-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
