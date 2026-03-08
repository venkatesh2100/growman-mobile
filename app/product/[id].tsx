import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiFetch } from '../../lib/api';
import { Product } from '../../lib/types';
import { useCartStore } from '../../store/cartStore';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.sizes.length > 0 && !selectedSize) {
      Alert.alert('Error', 'Please select a size');
      return;
    }

    addItem({
      productId: product.id,
      productSizeId: selectedSize?.id,
      name: product.name,
      price: selectedSize?.price || product.price,
      mrp: product.mrp,
      quantity: 1,
      image: product.imageUrl || '',
      label: selectedSize?.label,
      dimension: selectedSize?.dimension,
    });

    Alert.alert('Success', 'Product added to cart');
  };

  if (loading || !product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Image
        source={{ uri: product.imageUrl || 'https://via.placeholder.com/400' }}
        className="w-full h-[400px] bg-gray-100"
        resizeMode="cover"
      />

      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-3">{product.name}</Text>

        <View className="flex-row items-center gap-3 mb-6">
          <Text className="text-[28px] font-bold text-green-600">₹{selectedSize?.price || product.price}</Text>
          {product.mrp && product.mrp > (selectedSize?.price || product.price) && (
            <Text className="text-xl text-gray-400 line-through">₹{product.mrp}</Text>
          )}
        </View>

        {product.description && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Description</Text>
            <Text className="text-base text-gray-700 leading-6">{product.description}</Text>
          </View>
        )}

        {product.sizes.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Available Sizes</Text>
            <View className="flex-row flex-wrap gap-3">
              {product.sizes.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  className={`px-5 py-3 rounded-lg border-2 ${selectedSize?.id === size.id ? 'border-green-600 bg-green-100' : 'border-gray-200 bg-white'}`}
                  onPress={() => setSelectedSize(size)}>
                  <Text className={`text-base font-semibold ${selectedSize?.id === size.id ? 'text-green-600' : 'text-gray-700'}`}>
                    {size.label}
                  </Text>
                  <Text className={`text-sm mt-1 ${selectedSize?.id === size.id ? 'text-green-600' : 'text-gray-500'}`}>
                    ₹{size.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {product.attributes.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Specifications</Text>
            {product.attributes.map((attr) => (
              <View key={attr.id} className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-base text-gray-500 font-medium">{attr.name}:</Text>
                <Text className="text-base text-gray-900">{attr.value}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          className="flex-row items-center justify-center bg-green-600 p-4 rounded-xl gap-2 mt-2"
          onPress={handleAddToCart}>
          <MaterialIcons name="shopping-cart" size={24} color="#FFFFFF" />
          <Text className="text-lg font-semibold text-white">Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


