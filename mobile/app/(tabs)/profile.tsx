import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { me, auth } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { ResourceCard } from '@/components/ResourceCard';
import type { Resource } from '@/types/api';

type Tab = 'resources' | 'favorites' | 'saved';

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>('resources');
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const load = useCallback(async (t: Tab = tab) => {
    setLoading(true);
    const fn = t === 'resources' ? me.resources : t === 'favorites' ? me.favorites : me.saved;
    const res = await fn();
    if (res.data) setItems(res.data);
    setLoading(false);
    setRefreshing(false);
  }, [tab]);

  useEffect(() => { load(tab); }, [tab]);

  async function handleSubmitDraft(id: string) {
    setSubmittingId(id);
    const res = await me.submitDraft(id);
    setSubmittingId(null);
    if (res.error) {
      Alert.alert('Erreur', res.error.message);
      return;
    }
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'pending' } : r)));
  }

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter', style: 'destructive',
        onPress: async () => {
          await auth.signOut();
          await clearAuth();
        },
      },
    ]);
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'resources', label: 'Mes ressources', icon: 'document-text-outline' },
    { key: 'favorites', label: 'Favoris', icon: 'heart-outline' },
    { key: 'saved', label: 'Sauvegardés', icon: 'bookmark-outline' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(tab); }} />}
      >
        <View className="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-xl font-bold text-blue-600">
                  {(user?.firstName ?? user?.name ?? '?')[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-900">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name}
                </Text>
                <Text className="text-sm text-gray-500">{user?.email}</Text>
                <View className="flex-row items-center mt-1">
                  <View className={`px-2 py-0.5 rounded-full ${user?.role === 'admin' || user?.role === 'super_admin' ? 'bg-purple-100' : 'bg-blue-50'}`}>
                    <Text className={`text-xs font-medium capitalize ${user?.role === 'admin' || user?.role === 'super_admin' ? 'text-purple-700' : 'text-blue-600'}`}>
                      {user?.role ?? 'citoyen'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} className="p-2">
              <Ionicons name="log-out-outline" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                className={`flex-row items-center mr-3 px-4 py-2 rounded-full ${tab === t.key ? 'bg-blue-600' : 'bg-gray-100'}`}
              >
                <Ionicons name={t.icon as never} size={14} color={tab === t.key ? 'white' : '#6b7280'} />
                <Text className={`text-sm font-medium ml-1.5 ${tab === t.key ? 'text-white' : 'text-gray-600'}`}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="px-4 pt-4 pb-10">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : items.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="folder-open-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3">Aucun élément</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id}>
                <ResourceCard resource={item} />
                {tab === 'resources' && item.status === 'draft' && (
                  <TouchableOpacity
                    onPress={() => handleSubmitDraft(item.id)}
                    disabled={submittingId === item.id}
                    className="flex-row items-center justify-center bg-blue-50 rounded-xl py-2.5 mb-3 -mt-2"
                  >
                    {submittingId === item.id ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <>
                        <Ionicons name="send-outline" size={14} color="#2563eb" />
                        <Text className="ml-2 text-sm font-semibold text-blue-600">
                          Soumettre à validation
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
