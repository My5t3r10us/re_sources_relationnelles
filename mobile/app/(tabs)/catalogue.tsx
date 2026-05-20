import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resources, categories } from '@/lib/api';
import { ResourceCard } from '@/components/ResourceCard';
import type { Resource, Category, MediaType } from '@/types/api';

const MEDIA_TYPES: { label: string; value: MediaType | '' }[] = [
  { label: 'Tous', value: '' },
  { label: 'Articles', value: 'article' },
  { label: 'Vidéos', value: 'video' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Exercices', value: 'exercise' },
  { label: 'Audio', value: 'audio' },
];

export default function CatalogueScreen() {
  const [items, setItems] = useState<Resource[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedType, setSelectedType] = useState<MediaType | ''>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p = 1, reset = false) => {
    const res = await resources.list({
      page: p,
      limit: 15,
      search: search || undefined,
      category: selectedCat || undefined,
      mediaType: selectedType || undefined,
      status: 'published',
    });
    if (res.data) {
      setItems((prev) => (reset || p === 1 ? res.data! : [...prev, ...res.data!]));
      setTotal(res.meta?.total ?? 0);
    }
    setLoading(false);
    setRefreshing(false);
  }, [search, selectedCat, selectedType]);

  useEffect(() => {
    categories.list().then((r) => { if (r.data) setCats(r.data); });
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    load(1, true);
  }, [search, selectedCat, selectedType]);

  function loadMore() {
    if (items.length < total) {
      const next = page + 1;
      setPage(next);
      load(next);
    }
  }

  async function handleFavorite(id: string) {
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
    const res = await resources.toggleFavorite(id);
    if (res.data) {
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, isFavorite: res.data!.isFavorite } : r));
    } else {
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mb-3">
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Rechercher..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          {MEDIA_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setSelectedType(t.value as MediaType | '')}
              className={`mr-2 px-3 py-1.5 rounded-full ${selectedType === t.value ? 'bg-blue-600' : 'bg-gray-100'}`}
            >
              <Text className={`text-sm font-medium ${selectedType === t.value ? 'text-white' : 'text-gray-600'}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setSelectedCat('')}
            className={`mr-2 px-3 py-1.5 rounded-full ${selectedCat === '' ? 'bg-blue-600' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm font-medium ${selectedCat === '' ? 'text-white' : 'text-gray-600'}`}>
              Toutes
            </Text>
          </TouchableOpacity>
          {cats.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelectedCat(c.slug)}
              className={`mr-2 px-3 py-1.5 rounded-full ${selectedCat === c.slug ? 'bg-blue-600' : 'bg-gray-100'}`}
            >
              <Text className={`text-sm font-medium ${selectedCat === c.slug ? 'text-white' : 'text-gray-600'}`}>
                {c.icon ? `${c.icon} ` : ''}{c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pt-4 pb-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, true); }} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <ResourceCard resource={item} onFavoriteToggle={() => handleFavorite(item.id)} />
          )}
          ListFooterComponent={() =>
            items.length < total ? (
              <View className="items-center py-4">
                <ActivityIndicator color="#2563eb" />
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View className="items-center py-16">
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 text-base mt-3">Aucun résultat</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
