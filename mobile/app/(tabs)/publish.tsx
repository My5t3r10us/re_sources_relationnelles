import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { resources, categories } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category, MediaType } from '@/types/api';

const MEDIA_TYPES: { label: string; value: MediaType }[] = [
  { label: 'Article', value: 'article' },
  { label: 'Vidéo', value: 'video' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Exercice', value: 'exercise' },
  { label: 'Audio', value: 'audio' },
  { label: 'Protocole', value: 'protocol' },
];

export default function PublishScreen() {
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    summary: '',
    mediaType: 'article' as MediaType,
    categoryId: '' as string | null,
    privacy: 'public' as 'public' | 'private',
    isDraft: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categories.list().then((r) => { if (r.data) setCats(r.data); });
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(asDraft: boolean) {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Le titre et le contenu sont requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await resources.create({ ...form, isDraft: asDraft, categoryId: form.categoryId || null });
      if (res.data) {
        Alert.alert('Succès', asDraft ? 'Brouillon sauvegardé' : 'Ressource soumise pour validation');
        router.replace('/(tabs)');
      } else {
        setError(res.error?.message ?? 'Erreur lors de la publication');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-4 pb-10">
          <View className="py-5">
            <Text className="text-2xl font-bold text-gray-900">Publier une ressource</Text>
          </View>

          <Input
            label="Titre *"
            value={form.title}
            onChangeText={(v) => update('title', v)}
            placeholder="Titre de votre ressource"
          />
          <Input
            label="Résumé"
            value={form.summary}
            onChangeText={(v) => update('summary', v)}
            placeholder="Courte description (optionnel)"
            multiline
            numberOfLines={2}
          />
          <Input
            label="Contenu *"
            value={form.content}
            onChangeText={(v) => update('content', v)}
            placeholder="Rédigez votre contenu ici..."
            multiline
            numberOfLines={8}
            className="min-h-[120px]"
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">Type de média</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {MEDIA_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => update('mediaType', t.value)}
                className={`mr-2 px-4 py-2 rounded-xl border ${form.mediaType === t.value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-sm font-medium ${form.mediaType === t.value ? 'text-white' : 'text-gray-700'}`}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-sm font-medium text-gray-700 mb-2">Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <TouchableOpacity
              onPress={() => update('categoryId', null)}
              className={`mr-2 px-4 py-2 rounded-xl border ${!form.categoryId ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-sm font-medium ${!form.categoryId ? 'text-white' : 'text-gray-700'}`}>
                Aucune
              </Text>
            </TouchableOpacity>
            {cats.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => update('categoryId', c.id)}
                className={`mr-2 px-4 py-2 rounded-xl border ${form.categoryId === c.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-sm font-medium ${form.categoryId === c.id ? 'text-white' : 'text-gray-700'}`}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-sm font-medium text-gray-700 mb-2">Visibilité</Text>
          <View className="flex-row gap-3 mb-6">
            {(['public', 'private'] as const).map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => update('privacy', v)}
                className={`flex-1 py-3 rounded-xl border items-center ${form.privacy === v ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-sm font-semibold ${form.privacy === v ? 'text-white' : 'text-gray-700'}`}>
                  {v === 'public' ? 'Public' : 'Privé'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text className="text-sm text-red-500 mb-4">{error}</Text> : null}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button onPress={() => handleSubmit(true)} variant="secondary" loading={loading}>
                Brouillon
              </Button>
            </View>
            <View className="flex-1">
              <Button onPress={() => handleSubmit(false)} loading={loading}>
                Soumettre
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
