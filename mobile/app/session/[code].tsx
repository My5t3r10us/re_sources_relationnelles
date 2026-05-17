import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sessions } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { ResourceSession, SessionMessage } from '@/types/api';

const POLL_INTERVAL_MS = 3000;
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default function SessionScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const [session, setSession] = useState<ResourceSession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [sending, setSending] = useState(false);
  const lastMessageAtRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const isParticipant = !!session?.participants.some((p) => p.userId === currentUser?.id && !p.leftAt);
  const isHost = session?.hostId === currentUser?.id;
  const ended = session?.status === 'ended';

  const loadSession = useCallback(async () => {
    const res = await sessions.get(code);
    if (res.data) setSession(res.data);
    setLoading(false);
  }, [code]);

  const loadMessages = useCallback(async () => {
    const res = await sessions.getMessages(code, lastMessageAtRef.current ?? undefined);
    if (res.data && res.data.length > 0) {
      setMessages((prev) => (lastMessageAtRef.current ? [...prev, ...res.data!] : res.data!));
      lastMessageAtRef.current = res.data[res.data.length - 1].createdAt;
    } else if (!lastMessageAtRef.current && res.data) {
      setMessages([]);
    }
  }, [code]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!isParticipant || ended) return;
    loadMessages();
    const id = setInterval(() => {
      loadMessages();
      loadSession();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isParticipant, ended, loadMessages, loadSession]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleJoin() {
    setJoining(true);
    const res = await sessions.join(code);
    setJoining(false);
    if (res.error) {
      Alert.alert('Erreur', res.error.message);
      return;
    }
    await loadSession();
  }

  async function handleLeave() {
    Alert.alert('Quitter la session', 'Confirmer ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: async () => {
          await sessions.leave(code);
          router.back();
        },
      },
    ]);
  }

  async function handleEnd() {
    Alert.alert('Terminer la session', 'Cette action est irréversible pour tous les participants.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer',
        style: 'destructive',
        onPress: async () => {
          await sessions.end(code);
          setSession((s) => (s ? { ...s, status: 'ended' } : s));
        },
      },
    ]);
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    const res = await sessions.sendMessage(code, content);
    setSending(false);
    if (res.data) {
      setMessages((prev) => [...prev, res.data!]);
      lastMessageAtRef.current = res.data.createdAt;
      setInput('');
    } else if (res.error) {
      Alert.alert('Erreur', res.error.message);
    }
  }

  async function handleShare() {
    const url = `${BASE_URL}/session/${code}`;
    try {
      await Share.share({
        message: `Rejoignez ma session collaborative (RE)Sources : ${url}`,
        url,
      });
    } catch {
      // Cancelled
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
        <Text className="text-gray-500 text-center mt-3">Session introuvable.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-600 px-6 py-2 rounded-xl">
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (ended) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Ionicons name="power" size={48} color="#9ca3af" />
        <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">Session terminée</Text>
        <Text className="text-gray-500 text-center mb-6">L&apos;hôte a clos cette session.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-blue-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!isParticipant) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Ionicons name="people" size={48} color="#2563eb" />
        <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">{session.resourceTitle}</Text>
        <Text className="text-gray-500 text-center mb-1">Hôte : {session.hostName}</Text>
        <Text className="text-gray-500 text-center mb-6">
          {session.participants.length} participant{session.participants.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          onPress={handleJoin}
          disabled={joining}
          className="bg-blue-600 px-8 py-3 rounded-xl flex-row items-center"
        >
          {joining ? <ActivityIndicator color="white" /> : (
            <Text className="text-white font-semibold">Rejoindre la session</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-3">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xs text-gray-400">Code: {session.shareCode}</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={handleShare} hitSlop={8}>
              <Ionicons name="share-outline" size={20} color="#2563eb" />
            </TouchableOpacity>
            {isHost ? (
              <TouchableOpacity onPress={handleEnd} hitSlop={8}>
                <Ionicons name="power" size={20} color="#ef4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleLeave} hitSlop={8}>
                <Ionicons name="exit-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
          {session.resourceTitle}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="people-outline" size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-400 ml-1">
            {session.participants.length} en ligne · Hôte : {session.hostName}
          </Text>
        </View>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          ref={scrollRef}
          contentContainerClassName="px-4 py-3"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <Text className="text-gray-400 text-center py-12">Aucun message. Lancez la discussion !</Text>
          ) : (
            messages.map((m) => {
              const mine = m.authorId === currentUser?.id;
              return (
                <View key={m.id} className={`mb-2 max-w-[78%] ${mine ? 'self-end' : 'self-start'}`}>
                  {!mine && (
                    <Text className="text-xs text-gray-400 mb-0.5 ml-1">{m.authorName ?? 'Anonyme'}</Text>
                  )}
                  <View className={`rounded-2xl px-4 py-2 ${mine ? 'bg-blue-600' : 'bg-white border border-gray-100'}`}>
                    <Text className={`text-sm ${mine ? 'text-white' : 'text-gray-800'}`}>{m.content}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View className="flex-row items-end px-3 py-2 bg-white border-t border-gray-100 gap-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            placeholder="Écrire un message..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-base text-gray-900 max-h-32"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            className={`w-11 h-11 rounded-full items-center justify-center ${input.trim() ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={18} color={input.trim() ? 'white' : '#9ca3af'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
