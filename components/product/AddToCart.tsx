import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Product, ProductSize } from '../../lib/types';
import { useCartStore } from '../../store/cartStore';
import { toast } from '../Toast';

interface AddToCartProps {
  product: Product;
  selectedSize: ProductSize;
}

export default function AddToCart({ product, selectedSize }: AddToCartProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleAddToCart = () => {
    if (selectedSize.stock === 0) {
      toast('This item is out of stock', 'error');
      return;
    }

    const imageUrl = selectedSize.images?.[0] || product.imageUrl || '';
    const qty = Math.min(quantity, selectedSize.stock);

    // Add to cart store
    addItem({
      productId: product.id,
      productSizeId: selectedSize.id,
      name: product.name,
      mrp: product.mrp,
      price: selectedSize.price,
      label: selectedSize.label,
      dimension: selectedSize.dimension,
      quantity: qty,
      image: imageUrl,
    });

    // Show toast notification
    toast(`${product.name} (${selectedSize.label}) added to cart!`);
  };

  const handleBuyNow = () => {
    if (selectedSize.stock === 0) {
      toast('This item is out of stock', 'error');
      return;
    }

    // Add to cart first
    handleAddToCart();

    // Navigate to checkout
    setTimeout(() => {
      router.push('/checkout');
    }, 300);
  };

  return (
    <>
      <View className="space-y-4">
        {/* Quantity Selector */}
        <View className="flex-row items-center gap-4 pb-3">
          <Text className="text-gray-700 font-medium">Quantity:</Text>
          <View className="flex-row items-center border-2 border-gray-200 rounded-lg overflow-hidden">
            <TouchableOpacity
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 py-2 bg-gray-100 active:bg-gray-200"
              disabled={quantity <= 1}>
              <Text className="text-gray-600 text-lg">-</Text>
            </TouchableOpacity>
            <Text className="px-6 py-2 font-semibold text-gray-900 min-w-12 text-center">
              {quantity}
            </Text>
            <TouchableOpacity
              onPress={() => setQuantity((q) => Math.min(selectedSize.stock, q + 1))}
              className="px-4 py-2 bg-gray-100 active:bg-gray-200"
              disabled={quantity >= selectedSize.stock}>
              <Text className="text-gray-600 text-lg">+</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-500">
            {selectedSize.stock} available
          </Text>
          {/* <TouchableOpacity
            onPress={() => setIsWishlisted(!isWishlisted)}
            className={`p-2 border-2 rounded-full ${
              isWishlisted
                ? 'bg-red-50 border-red-300'
                : 'border-gray-200 bg-white active:bg-gray-50'
            }`}>
            <MaterialIcons
              name={isWishlisted ? 'favorite' : 'favorite-border'}
              size={22}
              color={isWishlisted ? '#EF4444' : '#6B7280'}
            />
          </TouchableOpacity> */}
    
        </View>

        {/* Buttons */}
        <View className="flex-row flex-wrap gap-4">
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={selectedSize.stock === 0}
            className={`flex-row items-center justify-center px-4 py-3 rounded-lg font-semibold ${
              selectedSize.stock === 0
                ? 'bg-gray-400'
                : 'bg-emerald-600 active:bg-emerald-700'
            }`}>
            <MaterialIcons name="shopping-cart" size={18} color="#FFFFFF" />
            <Text className="text-white ml-2 font-semibold">Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBuyNow}
            disabled={selectedSize.stock === 0}
            className={`flex-row items-center justify-center px-6 py-3 rounded-lg font-semibold ${
              selectedSize.stock === 0
                ? 'bg-gray-400'
                : 'bg-amber-500 active:bg-amber-600'
            }`}>
            <MaterialIcons name="flash-on" size={18} color="#FFFFFF" />
            <Text className="text-white ml-2 font-semibold">Buy Now</Text>
            
          </TouchableOpacity>

         
        </View>
      </View>

      {/* Login Popup */}
      <Modal visible={showLoginPrompt} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white p-6 rounded-xl max-w-sm w-full mx-4">
            <Text className="text-xl font-semibold mb-3 text-center">
              Please Sign In to Continue
            </Text>
            <Text className="text-gray-500 mb-6 text-center">
              You need to sign in to proceed with checkout.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                className="flex-1 px-5 py-2.5 bg-emerald-600 rounded-lg active:bg-emerald-700">
                <Text className="text-white font-medium text-center">Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowLoginPrompt(false)}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 rounded-lg active:bg-gray-50">
                <Text className="text-gray-700 font-medium text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

