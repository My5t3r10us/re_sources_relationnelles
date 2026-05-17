import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reports } from '@/lib/api';
import type { ReportReason } from '@/types/api';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Harcèlement' },
  { value: 'spam', label: 'Spam' },
  { value: 'misinformation', label: 'Désinformation' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'other', label: 'Autre' },
];

interface Props {
  resourceId?: string;
  commentId?: string;
  compact?: boolean;
}

export function ReportButton({ resourceId, commentId, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const res = await reports.create({
      reason,
      description: description.trim() || undefined,
      resourceId,
      commentId,
    });
    setSubmitting(false);
    if (res.error) {
      Alert.alert('Erreur', res.error.message);
      return;
    }
    setOpen(false);
    setDescription('');
    setReason('harassment');
    Alert.alert('Merci', 'Votre signalement a été envoyé.');
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        hitSlop={8}
        className={compact ? 'p-1' : 'flex-row items-center'}
      >
        <Ionicons name="flag-outline" size={compact ? 14 : 18} color="#9ca3af" />
        {!compact && (
          <Text className="text-sm text-gray-400 ml-1.5 font-medium">Signaler</Text>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Signaler ce contenu</Text>
              <TouchableOpacity onPress={() => setOpen(false)} disabled={submitting}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-2 font-medium">Motif</Text>
            <View className="mb-4">
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setReason(r.value)}
                  className={`flex-row items-center py-3 px-3 rounded-xl mb-1 ${reason === r.value ? 'bg-blue-50' : ''}`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${reason === r.value ? 'border-blue-600' : 'border-gray-300'}`}
                  >
                    {reason === r.value && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </View>
                  <Text className={`text-sm ${reason === r.value ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm text-gray-600 mb-2 font-medium">Description (optionnel)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
              placeholder="Décrivez brièvement le problème..."
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 rounded-xl p-3 text-base text-gray-900 mb-5 min-h-[80px]"
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="bg-red-600 rounded-xl py-3 items-center justify-center"
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Envoyer le signalement</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
