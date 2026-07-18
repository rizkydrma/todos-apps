/**
 * Tab shell member: Todos | Profile | Admin (role-gated).
 */
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

export default function MainTabsLayout() {
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.systemBackground },
        headerTintColor: theme.colors.label,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: theme.colors.systemBackground,
          borderTopColor: theme.colors.separator,
        },
      }}
    >
      <Tabs.Screen
        name="todos/index"
        options={{
          title: 'Todos',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name="checklist"
              size={22}
              tintColor={color}
              fallback={undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name="person.crop.circle"
              size={22}
              tintColor={color}
              fallback={undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? undefined : null,
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name="gearshape.fill"
              size={22}
              tintColor={color}
              fallback={undefined}
            />
          ),
        }}
      />
    </Tabs>
  );
}
