import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MarkdownRenderer from './MarkdownRenderer';

interface ProductTabsProps {
  fullDescription: string;
  specifications: any;
  reviews: any[];
}

export default function ProductTabs({
  fullDescription,
  specifications,
  reviews,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

  return (
    <View className="p-6 rounded-xl shadow-sm mt-8 bg-white">
      {/* Tabs */}
      <View className="border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            <TouchableOpacity
              className={`py-3 px-4 border-b-2 ${
                activeTab === 'description'
                  ? 'border-green-600'
                  : 'border-transparent'
              }`}
              onPress={() => setActiveTab('description')}>
              <Text
                className={`font-medium ${
                  activeTab === 'description' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                Description
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`py-3 px-4 border-b-2 ${
                activeTab === 'specifications'
                  ? 'border-green-600'
                  : 'border-transparent'
              }`}
              onPress={() => setActiveTab('specifications')}>
              <Text
                className={`font-medium ${
                  activeTab === 'specifications' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                Specifications
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`py-3 px-4 border-b-2 ${
                activeTab === 'reviews'
                  ? 'border-green-600'
                  : 'border-transparent'
              }`}
              onPress={() => setActiveTab('reviews')}>
              <Text
                className={`font-medium ${
                  activeTab === 'reviews' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                Reviews ({reviews.length})
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View className="py-6">
        {activeTab === 'description' && (
          <View>
            <MarkdownRenderer content={fullDescription} />
          </View>
        )}

        {activeTab === 'specifications' && specifications && (
          <View className="space-y-3">
            {typeof specifications === 'string' ? (
              <View className="gap-4">
                {specifications.split('|').map((item, idx) => {
                  const [label, value] = item.split(':').map((s) => s.trim());
                  return (
                    <View key={idx} className="flex-row border-b pb-2">
                      <Text className="text-gray-600 font-medium flex-1">{label}:</Text>
                      <Text className="text-gray-800 flex-1">{value}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="gap-4">
                {Object.entries(specifications).map(([key, value], idx) => (
                  <View key={idx} className="flex-row border-b pb-2">
                    <Text className="text-gray-600 font-medium flex-1">{key}:</Text>
                    <Text className="text-gray-800 flex-1">{String(value)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View>
            {reviews.length > 0 ? (
              <View>
                <View className="flex-row items-center mb-6">
                  <Text className="text-4xl font-bold mr-4">{avgRating.toFixed(1)}</Text>
                  <View>
                    <View className="flex-row">
                      {[...Array(5)].map((_, i) => (
                        <MaterialIcons
                          key={i}
                          name={i < Math.floor(avgRating) ? 'star' : 'star-border'}
                          size={20}
                          color={i < Math.floor(avgRating) ? '#FBBF24' : '#D1D5DB'}
                        />
                      ))}
                    </View>
                    <Text className="text-gray-600">
                      Based on {reviews.length} reviews
                    </Text>
                  </View>
                </View>

                <View className="space-y-6">
                  {reviews.map((review, idx) => (
                    <View key={idx} className="border-b pb-6 last:border-0">
                      <View className="flex-row items-center mb-2">
                        <View className="flex-row mr-4">
                          {[...Array(5)].map((_, i) => (
                            <MaterialIcons
                              key={i}
                              name={i < review.rating ? 'star' : 'star-border'}
                              size={16}
                              color={i < review.rating ? '#FBBF24' : '#D1D5DB'}
                            />
                          ))}
                        </View>
                        <Text className="font-bold">{review.title}</Text>
                      </View>
                      <Text className="text-gray-600 mb-2">{review.comment}</Text>
                      <Text className="text-sm text-gray-500">
                        by {review.user?.name || 'Anonymous'} •{' '}
                        {new Date(review.date).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text className="text-gray-600">
                No reviews yet. Be the first to review this product!
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

