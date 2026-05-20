import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleRegister() {
    const { firstName, lastName, email, password } = form;
    if (!email.trim() || !password.trim()) {
      setError('Email et mot de passe requis');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim() || email.split('@')[0];
      const res = await auth.signUp({ email: email.trim(), password, name, firstName: firstName.trim(), lastName: lastName.trim() });
      const token: string | undefined = res?.token ?? res?.session?.token;
      if (token && res?.user) {
        await setAuth(res.user, token);
        router.replace('/(tabs)');
      } else {
        setError(res?.error?.message ?? res?.message ?? "Impossible de créer le compte");
      }
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 justify-center">
          <View className="mb-10">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</Text>
            <Text className="text-base text-gray-500">Re-Sources Relationnelles</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Prénom" value={form.firstName} onChangeText={(v) => update('firstName', v)} placeholder="Jean" />
            </View>
            <View className="flex-1">
              <Input label="Nom" value={form.lastName} onChangeText={(v) => update('lastName', v)} placeholder="Dupont" />
            </View>
          </View>
          <Input
            label="Email"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="votre@email.com"
          />
          <Input
            label="Mot de passe"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            secureTextEntry
            placeholder="8 caractères minimum"
          />

          {error ? <Text className="text-sm text-red-500 mb-4 -mt-2">{error}</Text> : null}

          <Button onPress={handleRegister} loading={loading} size="lg">
            Créer mon compte
          </Button>

          <TouchableOpacity onPress={() => router.back()} className="mt-6 items-center">
            <Text className="text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Text className="text-blue-600 font-semibold">Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
