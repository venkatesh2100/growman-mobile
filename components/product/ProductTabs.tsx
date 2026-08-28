import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MarkdownRenderer from './MarkdownRenderer';

interface ProductTabsProps {
  fullDescription: string;
  specifications: any;
  reviews: any[];
}

type TabKey = 'description' | 'specifications' | 'reviews';

export default function ProductTabs({
  fullDescription,
  specifications,
  reviews,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('description');

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

  const specEntries: { label: string; value: string }[] = (() => {
    if (!specifications) return [];
    if (typeof specifications === 'string') {
      return specifications
        .split('|')
        .map((item) => {
          const [label, ...rest] = item.split(':');
          return { label: label?.trim() ?? '', value: rest.join(':').trim() };
        })
        .filter((row) => row.label && row.value);
    }
    return Object.entries(specifications).map(([key, value]) => ({
      label: key,
      value: String(value),
    }));
  })();

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'specifications', label: 'Specifications' },
    { key: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <View className="bg-white rounded-2xl p-4 border border-emerald-100/80 shadow-sm">
      <View className="border-b border-gray-200 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  className={`py-2.5 px-3 mr-1 border-b-2 ${
                    active ? 'border-emerald-600' : 'border-transparent'
                  }`}
                  onPress={() => setActiveTab(tab.key)}>
                  <Text
                    className={`text-sm ${active ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {activeTab === 'description' && (
        <View>
          {fullDescription.trim() ? (
            <MarkdownRenderer content={fullDescription} />
          ) : (
            <Text className="text-sm text-gray-600">No description available.</Text>
          )}
        </View>
      )}

      {activeTab === 'specifications' && (
        <View>
          {specEntries.length > 0 ? (
            specEntries.map((row, idx) => (
              <View
                key={`${row.label}-${idx}`}
                className={`flex-row py-2.5 ${
                  idx < specEntries.length - 1 ? 'border-b border-gray-100' : ''
                }`}>
                <Text className="text-sm text-gray-600 flex-1">{row.label}</Text>
                <Text className="text-sm text-gray-900 flex-1">{row.value}</Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-gray-600">No specifications listed.</Text>
          )}
        </View>
      )}

      {activeTab === 'reviews' && (
        <View>
          {reviews.length > 0 ? (
            <>
              <View className="flex-row items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Text className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</Text>
                <View>
                  <View className="flex-row">
                    {[...Array(5)].map((_, i) => (
                      <MaterialIcons
                        key={i}
                        name={i < Math.floor(avgRating) ? 'star' : 'star-border'}
                        size={16}
                        color={i < Math.floor(avgRating) ? '#10B981' : '#D1D5DB'}
                      />
                    ))}
                  </View>
                  <Text className="text-xs text-gray-600 mt-0.5">
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              </View>

              {reviews.map((review, idx) => (
                <View
                  key={idx}
                  className={`py-4 ${idx < reviews.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <View className="flex-row items-center mb-1.5">
                    <View className="flex-row mr-3">
                      {[...Array(5)].map((_, i) => (
                        <MaterialIcons
                          key={i}
                          name={i < review.rating ? 'star' : 'star-border'}
                          size={14}
                          color={i < review.rating ? '#10B981' : '#D1D5DB'}
                        />
                      ))}
                    </View>
                    {review.title ? (
                      <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>
                        {review.title}
                      </Text>
                    ) : null}
                  </View>
                  {review.comment ? (
                    <Text className="text-sm text-gray-700 leading-relaxed mb-1.5">{review.comment}</Text>
                  ) : null}
                  <Text className="text-xs text-gray-500">
                    {review.user?.name || 'Anonymous'} · {new Date(review.date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text className="text-sm text-gray-600">No reviews yet.</Text>
          )}
        </View>
      )}
    </View>
  );
}
