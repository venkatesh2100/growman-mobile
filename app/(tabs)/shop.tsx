import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ProductCard from '../../components/ProductCard';
import { apiFetch, searchProducts } from '../../lib/api';
import { Product } from '../../lib/types';

type SortBy = 'name' | 'price' | 'newest';

export default function ShopScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        loadProducts();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/products?page=1&pageSize=50');
      if (response.ok) {
        const data = await response.json();
        const productsList = Array.isArray(data) ? data : data.data || [];
        setProducts(sortProducts(productsList));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadProducts();
      return;
    }

    try {
      setSearching(true);
      const result = await searchProducts(query);
      setProducts(sortProducts(result.data));
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearching(false);
    }
  };

  const sortProducts = (productsList: Product[]): Product[] => {
    const sorted = [...productsList];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price':
        return sorted.sort((a, b) => a.price - b.price);
      case 'newest':
      default:
        return sorted;
    }
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    setProducts(sortProducts(products));
    setShowFilters(false);
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <View className="w-[48%]">
      <ProductCard
        product={item}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.slug.toString() } })}
        index={index}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search and Filter Bar */}
      <View className="flex-row p-4 bg-white border-b border-gray-200 gap-3">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
          <MaterialIcons name="search" size={22} color="#6B7280" className="mr-3" />
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search for plants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          className="w-12 h-12 rounded-xl bg-green-100 justify-center items-center"
          onPress={() => setShowFilters(true)}>
          <MaterialIcons name="tune" size={24} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      {!loading && !searching && (
        <View className="px-4 py-3">
          <Text className="text-sm text-gray-500">
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </Text>
        </View>
      )}

      {/* Products List */}
      {loading || searching ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <MaterialIcons name="inventory-2" size={64} color="#D1D5DB" />
          <Text className="text-xl font-semibold text-gray-900 mt-4">No products found</Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            {searchQuery ? 'Try a different search term' : 'Check back later for new products'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[50%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Sort By</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialIcons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <View className="gap-3">
              <TouchableOpacity
                className={`flex-row justify-between items-center p-4 rounded-xl ${sortBy === 'newest' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'}`}
                onPress={() => handleSortChange('newest')}>
                <Text className={`text-base font-medium ${sortBy === 'newest' ? 'text-green-600 font-semibold' : 'text-gray-900'}`}>
                  Newest First
                </Text>
                {sortBy === 'newest' && (
                  <MaterialIcons name="check" size={20} color="#059669" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-row justify-between items-center p-4 rounded-xl ${sortBy === 'name' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'}`}
                onPress={() => handleSortChange('name')}>
                <Text className={`text-base font-medium ${sortBy === 'name' ? 'text-green-600 font-semibold' : 'text-gray-900'}`}>
                  Name (A-Z)
                </Text>
                {sortBy === 'name' && (
                  <MaterialIcons name="check" size={20} color="#059669" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-row justify-between items-center p-4 rounded-xl ${sortBy === 'price' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'}`}
                onPress={() => handleSortChange('price')}>
                <Text className={`text-base font-medium ${sortBy === 'price' ? 'text-green-600 font-semibold' : 'text-gray-900'}`}>
                  Price (Low to High)
                </Text>
                {sortBy === 'price' && (
                  <MaterialIcons name="check" size={20} color="#059669" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
