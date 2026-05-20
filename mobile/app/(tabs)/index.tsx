import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resources } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { ResourceCard } from '@/components/ResourceCard';
import type { Resource } from '@/types/api';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [featured, setFeatured] = useState<Resource[]>([]);
  const [recent, setRecent] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [featRes, recentRes] = await Promise.all([
      resources.list({ status: 'published', limit: 5 }),
      resources.list({ status: 'published', limit: 10, page: 1 }),
    ]);
    if (featRes.data) setFeatured(featRes.data.filter((r) => r.featured));
    if (recentRes.data) setRecent(recentRes.data.filter((r) => !r.featured).slice(0, 8));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleFavorite(id: string) {
    const flip = (r: Resource) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r;
    setFeatured((prev) => prev.map(flip));
    setRecent((prev) => prev.map(flip));
    const res = await resources.toggleFavorite(id);
    if (res.data) {
      const apply = (r: Resource) => r.id === id ? { ...r, isFavorite: res.data!.isFavorite } : r;
      setFeatured((prev) => prev.map(apply));
      setRecent((prev) => prev.map(apply));
    } else {
      setFeatured((prev) => prev.map(flip));
      setRecent((prev) => prev.map(flip));
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const greeting = user?.firstName ? `Bonjour, ${user.firstName} 👋` : 'Bonjour 👋';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <FlatList
        data={[...featured, ...recent]}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerClassName="px-4 pb-6"
        ListHeaderComponent={() => (
          <View className="py-5">
            <Text className="text-2xl font-bold text-gray-900 mb-1">{greeting}</Text>
            <Text className="text-base text-gray-500 mb-5">Découvrez des ressources pour votre bien-être</Text>
            {featured.length > 0 && (
              <Text className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                À la une
              </Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <ResourceCard resource={item} onFavoriteToggle={() => handleFavorite(item.id)} />
        )}
        ListEmptyComponent={() => (
          <View className="items-center py-16">
            <Text className="text-gray-400 text-base">Aucune ressource disponible</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
