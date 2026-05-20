import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Email et mot de passe requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await auth.signIn(email.trim(), password);
      const token: string | undefined = res?.token ?? res?.session?.token;
      if (token && res?.user) {
        await setAuth(res.user, token);
        router.replace('/(tabs)');
      } else {
        setError(res?.error?.message ?? res?.message ?? 'Email ou mot de passe incorrect');
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
            <Text className="text-3xl font-bold text-gray-900 mb-2">Connexion</Text>
            <Text className="text-base text-gray-500">Re-Sources Relationnelles</Text>
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="votre@email.com"
          />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          {error ? <Text className="text-sm text-red-500 mb-4 -mt-2">{error}</Text> : null}

          <Button onPress={handleLogin} loading={loading} size="lg">
            Se connecter
          </Button>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="mt-6 items-center">
            <Text className="text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Text className="text-blue-600 font-semibold">Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
