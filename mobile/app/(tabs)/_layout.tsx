import { Tabs } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';

function PlusTabButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center -mt-5 shadow-lg"
    >
      <Ionicons name="add" size={28} color="white" />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#f3f4f6', paddingTop: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="catalogue"
        options={{
          title: 'Catalogue',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => <PlusTabButton onPress={props.onPress ?? undefined} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? '/admin' : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
