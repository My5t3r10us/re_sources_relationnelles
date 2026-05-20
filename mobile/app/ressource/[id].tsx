import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { resources, comments as commentsApi, sessions } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { CommentItem } from '@/components/CommentItem';
import { ReportButton } from '@/components/ReportButton';
import type { Resource, Comment } from '@/types/api';

const COLLABORATIVE_TYPES = new Set(['exercise', 'protocol']);

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [resource, setResource] = useState<Resource | null>(null);
  const [commentList, setCommentList] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [startingSession, setStartingSession] = useState(false);

  async function handleStartSession() {
    if (!resource) return;
    setStartingSession(true);
    const res = await sessions.start(resource.id);
    setStartingSession(false);
    if (res.error) {
      Alert.alert('Erreur', res.error.message);
      return;
    }
    if (res.data?.shareCode) {
      router.push(`/session/${res.data.shareCode}`);
    }
  }

  const load = useCallback(async () => {
    const [rRes, cRes] = await Promise.all([
      resources.get(id),
      commentsApi.list(id),
    ]);
    if (rRes.data) {
      setResource(rRes.data);
      navigation.setOptions({ title: rRes.data.title });
    }
    if (cRes.data) setCommentList(cRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function toggleFavorite() {
    if (!resource) return;
    const res = await resources.toggleFavorite(id);
    if (res.data) setResource((r) => r ? { ...r, isFavorite: res.data!.isFavorite } : r);
  }

  async function toggleRead() {
    if (!resource) return;
    const res = await resources.toggleRead(id);
    if (res.data) setResource((r) => r ? { ...r, isRead: res.data!.isRead } : r);
  }

  async function toggleSave() {
    if (!resource) return;
    const res = await resources.toggleSave(id);
    if (res.data) setResource((r) => r ? { ...r, isSaved: res.data!.isSaved } : r);
  }

  async function handleCommentSubmit() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const res = await commentsApi.create(id, newComment.trim());
    if (res.data) {
      setCommentList((prev) => [res.data!, ...prev]);
      setNewComment('');
    } else {
      Alert.alert('Erreur', res.error?.message ?? 'Impossible d\'ajouter le commentaire');
    }
    setSubmitting(false);
  }

  async function handleLike(commentId: string) {
    const res = await commentsApi.toggleLike(commentId);
    if (res.data) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (res.data!.liked) next.add(commentId);
        else next.delete(commentId);
        return next;
      });
      setCommentList((prev) =>
        prev.map((c) => c.id === commentId
          ? { ...c, likes: res.data!.liked ? c.likes + 1 : Math.max(0, c.likes - 1) }
          : c
        )
      );
    }
  }

  async function handleDeleteComment(commentId: string) {
    Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await commentsApi.remove(commentId);
          setCommentList((prev) => prev.filter((c) => c.id !== commentId));
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!resource) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Ressource introuvable</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="pb-6">
          <View className="px-4 pt-4">
            <View className="flex-row items-center mb-3 flex-wrap gap-2">
              {resource.categoryName && (
                <View className="bg-blue-50 px-2 py-1 rounded-full">
                  <Text className="text-xs text-blue-600 font-medium">{resource.categoryName}</Text>
                </View>
              )}
              <View className="bg-gray-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-gray-600 capitalize">{resource.mediaType}</Text>
              </View>
              {resource.featured && (
                <View className="bg-yellow-50 px-2 py-1 rounded-full flex-row items-center">
                  <Ionicons name="star" size={11} color="#f59e0b" />
                  <Text className="text-xs text-yellow-600 font-medium ml-1">À la une</Text>
                </View>
              )}
            </View>

            <Text className="text-2xl font-bold text-gray-900 mb-2">{resource.title}</Text>

            {resource.summary && (
              <Text className="text-base text-gray-500 mb-4 leading-6">{resource.summary}</Text>
            )}

            <View className="flex-row items-center mb-4">
              {resource.authorName && (
                <Text className="text-sm text-gray-400 mr-3">Par {resource.authorName}</Text>
              )}
              {resource.readingTime && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={13} color="#9ca3af" />
                  <Text className="text-sm text-gray-400 ml-1">{resource.readingTime} min</Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-3 mb-6 border-y border-gray-100 py-3">
              <TouchableOpacity onPress={toggleFavorite} className="flex-row items-center">
                <Ionicons name={resource.isFavorite ? 'heart' : 'heart-outline'} size={20} color={resource.isFavorite ? '#ec4899' : '#9ca3af'} />
                <Text className={`text-sm ml-1.5 font-medium ${resource.isFavorite ? 'text-pink-500' : 'text-gray-400'}`}>
                  Favori
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSave} className="flex-row items-center">
                <Ionicons name={resource.isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={resource.isSaved ? '#2563eb' : '#9ca3af'} />
                <Text className={`text-sm ml-1.5 font-medium ${resource.isSaved ? 'text-blue-600' : 'text-gray-400'}`}>
                  Sauvegarder
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleRead} className="flex-row items-center">
                <Ionicons name={resource.isRead ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={resource.isRead ? '#10b981' : '#9ca3af'} />
                <Text className={`text-sm ml-1.5 font-medium ${resource.isRead ? 'text-green-600' : 'text-gray-400'}`}>
                  Lu
                </Text>
              </TouchableOpacity>
              {user && user.id !== resource.authorId && (
                <ReportButton resourceId={resource.id} />
              )}
            </View>

            {user && resource.status === 'published' && COLLABORATIVE_TYPES.has(resource.mediaType) && (
              <TouchableOpacity
                onPress={handleStartSession}
                disabled={startingSession}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-blue-900 mb-0.5">
                    Pratiquer en groupe ?
                  </Text>
                  <Text className="text-xs text-blue-700">
                    Démarrez une session collaborative et invitez d&apos;autres citoyens.
                  </Text>
                </View>
                {startingSession ? (
                  <ActivityIndicator color="#2563eb" />
                ) : (
                  <View className="bg-blue-600 rounded-xl px-4 py-2 flex-row items-center">
                    <Ionicons name="people" size={14} color="white" />
                    <Text className="text-white font-semibold text-xs ml-1.5">Démarrer</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <Text className="text-base text-gray-800 leading-7 mb-8">{resource.content}</Text>

            <Text className="text-lg font-bold text-gray-900 mb-4">
              Commentaires ({commentList.length})
            </Text>

            {user && (
              <View className="flex-row items-end mb-6 gap-2">
                <View className="flex-1">
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 min-h-[48px]"
                    placeholder="Ajouter un commentaire..."
                    placeholderTextColor="#9ca3af"
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                  />
                </View>
                <TouchableOpacity
                  onPress={handleCommentSubmit}
                  disabled={submitting || !newComment.trim()}
                  className={`w-12 h-12 rounded-xl items-center justify-center ${newComment.trim() ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="white" />
                    : <Ionicons name="send" size={18} color={newComment.trim() ? 'white' : '#9ca3af'} />
                  }
                </TouchableOpacity>
              </View>
            )}

            {commentList.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-gray-400">Aucun commentaire pour l'instant</Text>
              </View>
            ) : (
              commentList.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onDelete={handleDeleteComment}
                  isLiked={likedIds.has(c.id)}
                />
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
