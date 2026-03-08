import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Product } from '../../lib/types';
import ProductCard from '../ProductCard';

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  const displayableProducts = products?.filter(Boolean) ?? [];

  if (displayableProducts.length === 0) {
    return (
      <View className="mt-10">
        <Text className="text-xl font-bold mb-4">Related Products</Text>
        <Text className="text-gray-500">No related products found.</Text>
      </View>
    );
  }

  return (
    <View className="mt-10">
      <Text className="text-xl font-bold mb-4">Related Products</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
        <View className="flex-row gap-4 px-2">
          {displayableProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              className="min-w-[250px]"
              onPress={() => router.push(`/product/${product.slug}`)}>
              <ProductCard product={product} onPress={() => router.push(`/product/${product.slug}`)} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
