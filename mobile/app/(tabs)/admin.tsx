import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { admin } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { AdminStats, Resource, AdminUser, Report, UserRole } from '@/types/api';

type Section = 'stats' | 'resources' | 'users' | 'reports';

type CreatableRole = Exclude<UserRole, 'citizen'>;

export default function AdminScreen() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [section, setSection] = useState<Section>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  // Create-user modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<CreatableRole>('moderator');
  const [creating, setCreating] = useState(false);

  async function handleCreateUser() {
    if (!newName.trim() || !newEmail.trim() || newPassword.length < 8) {
      Alert.alert('Erreur', 'Tous les champs sont requis (mot de passe ≥ 8 caractères)');
      return;
    }
    setCreating(true);
    const res = await admin.users.create({
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword,
      role: newRole,
    });
    setCreating(false);
    if (res.error) {
      Alert.alert('Erreur', res.error.message);
      return;
    }
    setCreateOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('moderator');
    Alert.alert('Succès', 'Compte créé avec succès');
    loadSection('users');
  }

  useEffect(() => {
    loadSection(section);
  }, [section]);

  async function loadSection(s: Section) {
    setLoading(true);
    if (s === 'stats') {
      const r = await admin.stats();
      if (r.data) setStats(r.data);
    } else if (s === 'resources') {
      const r = await admin.resources.list({ status: 'pending' });
      if (r.data) setResources(r.data);
    } else if (s === 'users') {
      const r = await admin.users.list();
      if (r.data) setUsers(r.data as AdminUser[]);
    } else if (s === 'reports') {
      const r = await admin.reports.list(false);
      if (r.data) setReports(r.data as Report[]);
    }
    setLoading(false);
  }

  async function approveResource(id: string) {
    await admin.resources.setStatus(id, 'published');
    loadSection('resources');
  }

  async function rejectResource(id: string) {
    await admin.resources.setStatus(id, 'rejected');
    loadSection('resources');
  }

  async function toggleUserActive(id: string) {
    await admin.users.toggleActive(id);
    loadSection('users');
  }

  async function resolveReport(id: string) {
    await admin.reports.resolve(id);
    loadSection('reports');
  }

  const sections: { key: Section; label: string; icon: string }[] = [
    { key: 'stats', label: 'Stats', icon: 'bar-chart-outline' },
    { key: 'resources', label: 'Modération', icon: 'shield-checkmark-outline' },
    { key: 'users', label: 'Utilisateurs', icon: 'people-outline' },
    { key: 'reports', label: 'Signalements', icon: 'flag-outline' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white border-b border-gray-100 px-4 pt-4 pb-0">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Administration</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-3">
          {sections.map((s) => (
            <TouchableOpacity
              key={s.key}
              onPress={() => setSection(s.key)}
              className={`flex-row items-center mr-3 px-4 py-2 rounded-full ${section === s.key ? 'bg-blue-600' : 'bg-gray-100'}`}
            >
              <Ionicons name={s.icon as never} size={14} color={section === s.key ? 'white' : '#6b7280'} />
              <Text className={`text-sm font-medium ml-1.5 ${section === s.key ? 'text-white' : 'text-gray-600'}`}>
                {s.label}
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
        <ScrollView contentContainerClassName="px-4 py-4">
          {section === 'stats' && stats && (
            <View>
              <View className="flex-row flex-wrap gap-3">
                {[
                  { label: 'Ressources', value: stats.resources.total, icon: 'document-text', color: '#3b82f6' },
                  { label: 'Publiées', value: stats.resources.published, icon: 'checkmark-circle', color: '#10b981' },
                  { label: 'En attente', value: stats.resources.pending, icon: 'time', color: '#f59e0b' },
                  { label: 'Utilisateurs', value: stats.users.total, icon: 'people', color: '#8b5cf6' },
                  { label: 'Commentaires', value: stats.comments.total, icon: 'chatbubbles', color: '#6b7280' },
                  { label: 'Signalements', value: stats.reports.pending, icon: 'flag', color: '#ef4444' },
                ].map((stat) => (
                  <View key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100" style={{ width: '47%' }}>
                    <View className="flex-row items-center mb-2">
                      <Ionicons name={stat.icon as never} size={18} color={stat.color} />
                      <Text className="text-xs text-gray-500 ml-2">{stat.label}</Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{stat.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {section === 'resources' && resources.map((r) => (
            <View key={r.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
              <Text className="font-semibold text-gray-900 mb-1" numberOfLines={2}>{r.title}</Text>
              <Text className="text-sm text-gray-500 mb-3">Par {r.authorName} · {r.mediaType}</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => approveResource(r.id)} className="flex-1 bg-green-600 py-2 rounded-xl items-center">
                  <Text className="text-white text-sm font-semibold">Approuver</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => rejectResource(r.id)} className="flex-1 bg-red-100 py-2 rounded-xl items-center">
                  <Text className="text-red-600 text-sm font-semibold">Rejeter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {section === 'users' && isSuperAdmin && (
            <TouchableOpacity
              onPress={() => setCreateOpen(true)}
              className="flex-row items-center justify-center bg-blue-600 rounded-2xl py-3 mb-3"
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text className="text-white font-semibold ml-2">Créer un compte admin</Text>
            </TouchableOpacity>
          )}

          {section === 'users' && users.map((u) => (
            <View key={u.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-gray-900">{u.name}</Text>
                <Text className="text-sm text-gray-500">{u.email}</Text>
                <Text className="text-xs text-blue-600 mt-0.5 capitalize">{u.role}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleUserActive(u.id)}
                className={`px-3 py-1.5 rounded-full ${u.active ? 'bg-green-100' : 'bg-gray-100'}`}
              >
                <Text className={`text-xs font-semibold ${u.active ? 'text-green-700' : 'text-gray-500'}`}>
                  {u.active ? 'Actif' : 'Inactif'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {section === 'reports' && reports.map((r) => (
            <View key={r.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <View className="bg-red-100 px-2 py-0.5 rounded-full mr-2">
                  <Text className="text-xs text-red-600 font-medium capitalize">{r.reason}</Text>
                </View>
                <Text className="text-xs text-gray-400">Par {r.reporterName}</Text>
              </View>
              {r.resourceTitle && <Text className="text-sm text-gray-700 mb-2">Ressource : {r.resourceTitle}</Text>}
              {r.description && <Text className="text-sm text-gray-500 mb-3">{r.description}</Text>}
              <TouchableOpacity onPress={() => resolveReport(r.id)} className="bg-blue-600 py-2 rounded-xl items-center">
                <Text className="text-white text-sm font-semibold">Marquer comme résolu</Text>
              </TouchableOpacity>
            </View>
          ))}

          {(section === 'resources' && resources.length === 0 && !loading) ||
          (section === 'users' && users.length === 0 && !loading) ||
          (section === 'reports' && reports.length === 0 && !loading) ? (
            <View className="items-center py-12">
              <Text className="text-gray-400">Aucun élément</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      <Modal
        visible={createOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Nouveau compte admin</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)} disabled={creating}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-1.5 font-medium">Nom complet</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              className="bg-gray-50 rounded-xl p-3 text-base text-gray-900 mb-3"
            />

            <Text className="text-sm text-gray-600 mb-1.5 font-medium">Email</Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="bg-gray-50 rounded-xl p-3 text-base text-gray-900 mb-3"
            />

            <Text className="text-sm text-gray-600 mb-1.5 font-medium">Mot de passe (8+ caractères)</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              className="bg-gray-50 rounded-xl p-3 text-base text-gray-900 mb-4"
            />

            <Text className="text-sm text-gray-600 mb-2 font-medium">Rôle</Text>
            <View className="flex-row gap-2 mb-5">
              {([
                { value: 'moderator', label: 'Modérateur' },
                { value: 'admin', label: 'Admin' },
                { value: 'super_admin', label: 'Super-Admin' },
              ] as { value: CreatableRole; label: string }[]).map((r) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setNewRole(r.value)}
                  className={`flex-1 rounded-xl py-2 items-center ${newRole === r.value ? 'bg-blue-600' : 'bg-gray-100'}`}
                >
                  <Text className={`text-xs font-semibold ${newRole === r.value ? 'text-white' : 'text-gray-600'}`}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleCreateUser}
              disabled={creating}
              className="bg-blue-600 rounded-xl py-3 items-center justify-center"
            >
              {creating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Créer le compte</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
