/**
 * Tab shell member — Home | + (create) | Profile.
 * Create sheet di-host TodoCreateProvider (center + tab bar).
 */
import {
  FloatingPillTabBar,
  useFloatingTabBarInset,
} from '@/components/navigation/FloatingPillTabBar';
import { useAppTheme } from '@/context/ThemeContext';
import { TodoCreateProvider } from '@/features/todos/context/TodoCreateContext';
import { MAIN_TABS } from '@/navigation/mainTabs';
import { Tabs } from 'expo-router';

export default function MainTabsLayout() {
  const { theme } = useAppTheme();
  const tabInset = useFloatingTabBarInset();

  return (
    <TodoCreateProvider>
      <Tabs
        tabBar={(props) => (
          <FloatingPillTabBar
            state={props.state}
            descriptors={props.descriptors}
            navigation={{
              emit: (event) =>
                props.navigation.emit({
                  type: event.type as 'tabPress',
                  target: event.target,
                  canPreventDefault: true,
                }),
              navigate: (name) => {
                props.navigation.navigate(name as never);
              },
            }}
          />
        )}
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: theme.colors.systemBackground },
          headerTintColor: theme.colors.label,
          headerShadowVisible: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 0,
          },
          tabBarBackground: () => null,
          sceneStyle: {
            paddingBottom: tabInset,
            backgroundColor: theme.colors.systemGroupedBackground,
          },
        }}
      >
        {MAIN_TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.title }}
          />
        ))}
      </Tabs>
    </TodoCreateProvider>
  );
}
