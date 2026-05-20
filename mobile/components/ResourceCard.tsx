import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Resource, MediaType } from '@/types/api';

const mediaTypeIcons: Record<MediaType, string> = {
  article: 'document-text',
  video: 'play-circle',
  pdf: 'document',
  exercise: 'barbell',
  audio: 'headset',
  protocol: 'list',
};

const mediaTypeColors: Record<MediaType, string> = {
  article: '#3b82f6',
  video: '#ef4444',
  pdf: '#f59e0b',
  exercise: '#10b981',
  audio: '#8b5cf6',
  protocol: '#6b7280',
};

interface ResourceCardProps {
  resource: Resource;
  onFavoriteToggle?: () => void;
}

export function ResourceCard({ resource, onFavoriteToggle }: ResourceCardProps) {
  const router = useRouter();
  const icon = mediaTypeIcons[resource.mediaType] ?? 'document';
  const color = mediaTypeColors[resource.mediaType] ?? '#6b7280';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/ressource/${resource.id}`)}
      className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm border border-gray-100"
    >
      {resource.imageUrl && (
        <Image
          source={{ uri: resource.imageUrl }}
          className="w-full h-40"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View className="rounded-full p-1.5 mr-2" style={{ backgroundColor: `${color}20` }}>
            <Ionicons name={icon as never} size={14} color={color} />
          </View>
          <Text className="text-xs text-gray-500 capitalize">{resource.mediaType}</Text>
          {resource.categoryName && (
            <>
              <Text className="text-xs text-gray-300 mx-1">·</Text>
              <Text className="text-xs text-gray-500">{resource.categoryName}</Text>
            </>
          )}
          {resource.featured && (
            <>
              <Text className="text-xs text-gray-300 mx-1">·</Text>
              <Ionicons name="star" size={12} color="#f59e0b" />
            </>
          )}
        </View>

        <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
          {resource.title}
        </Text>

        {resource.summary && (
          <Text className="text-sm text-gray-500 mb-3" numberOfLines={2}>
            {resource.summary}
          </Text>
        )}

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {resource.readingTime && (
              <View className="flex-row items-center mr-3">
                <Ionicons name="time-outline" size={13} color="#9ca3af" />
                <Text className="text-xs text-gray-400 ml-1">{resource.readingTime} min</Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={13} color="#9ca3af" />
              <Text className="text-xs text-gray-400 ml-1">{resource.viewCount}</Text>
            </View>
          </View>

          {onFavoriteToggle && (
            <TouchableOpacity onPress={onFavoriteToggle} hitSlop={8}>
              <Ionicons
                name={resource.isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={resource.isFavorite ? '#ec4899' : '#9ca3af'}
              />
            </TouchableOpacity>
          )}
        </View>

        {resource.authorName && (
          <Text className="text-xs text-gray-400 mt-2">Par {resource.authorName}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
