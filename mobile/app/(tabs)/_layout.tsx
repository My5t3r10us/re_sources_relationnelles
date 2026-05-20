import { Tabs } from 'expo-router';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONFIG: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap; label: string }> = {
  index:     { active: 'home',          inactive: 'home-outline',    label: 'Accueil'  },
  catalogue: { active: 'search',        inactive: 'search-outline',  label: 'Catalogue' },
  profile:   { active: 'person',        inactive: 'person-outline',  label: 'Profil'   },
  admin:     { active: 'shield',        inactive: 'shield-outline',  label: 'Admin'    },
};

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 10,
        paddingHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const isPlus = route.name === 'publish';

        if (route.name === 'admin' && !isAdmin) return null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (isPlus) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#2563eb',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -20,
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 12,
                }}
              >
                <Ionicons name="add" size={26} color="white" />
              </View>
            </TouchableOpacity>
          );
        }

        const cfg = TAB_CONFIG[route.name];
        if (!cfg) return null;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}
          >
            <View
              style={{
                width: 44,
                height: 32,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFocused ? '#eff6ff' : 'transparent',
              }}
            >
              <Ionicons
                name={isFocused ? cfg.active : cfg.inactive}
                size={22}
                color={isFocused ? '#2563eb' : '#9ca3af'}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: isFocused ? '600' : '400',
                color: isFocused ? '#2563eb' : '#9ca3af',
                letterSpacing: 0.1,
              }}
            >
              {cfg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="catalogue" />
      <Tabs.Screen name="publish" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen
        name="admin"
        options={{ href: isAdmin ? '/admin' : null }}
      />
    </Tabs>
  );
}
