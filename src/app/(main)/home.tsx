/**
 * Screen beranda: daftar todo lokal (state in-memory, belum sync API).
 *
 * Fitur:
 * - Tambah / centang selesai / hapus todo
 * - Inset grouped list (HIG) di systemGroupedBackground
 * - Header: sapaan user, logout, ThemeToggle
 * - SF Symbols chrome + commit haptics
 *
 * Catatan: todos hilang saat app restart (belum persist/backend).
 */
import { AppText, Screen, ThemeToggle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { hapticCommit } from '@/lib/haptics';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

/** Item todo di state lokal. */
interface TodoItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export default function Home() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user, signOut } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputText, setInputText] = useState('');

  const styles = useThemedStyles((t) => ({
    root: {
      flex: 1,
      paddingHorizontal: t.spacing.md,
      paddingTop: t.spacing.md,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: t.spacing.lg,
      marginTop: t.spacing.sm,
    },
    headerActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
    },
    logoutButton: {
      paddingVertical: t.spacing.xs,
      paddingHorizontal: t.spacing.sm,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
    },
    subtitle: {
      marginTop: t.spacing.xs,
    },
    group: {
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderRadius: t.radius.xl,
      overflow: 'hidden' as const,
      marginBottom: t.spacing.md,
    },
    composerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      minHeight: t.size.controlHeight,
    },
    input: {
      flex: 1,
      fontSize: t.fontSize.md,
      paddingVertical: Platform.OS === 'ios' ? t.spacing.sm : t.spacing.xs,
      paddingRight: t.spacing.sm,
      color: t.colors.label,
    },
    addButton: {
      width: t.size.iconButton,
      height: t.size.iconButton,
      borderRadius: t.radius.full,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: t.colors.primary,
    },
    listContent: {
      paddingBottom: t.spacing.lg,
      flexGrow: 1,
    },
    emptyText: {
      textAlign: 'center' as const,
      marginTop: t.spacing.xxl,
      paddingHorizontal: t.spacing.lg,
    },
    todoRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.md,
      minHeight: t.size.touchMin,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
    },
    firstRow: {
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
    },
    lastRow: {
      borderBottomLeftRadius: t.radius.xl,
      borderBottomRightRadius: t.radius.xl,
      marginBottom: t.spacing.md,
    },
    onlyRow: {
      borderRadius: t.radius.xl,
      marginBottom: t.spacing.md,
    },
    todoTextContainer: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
    },
    todoCompleted: {
      textDecorationLine: 'line-through' as const,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.colors.separator,
      marginLeft: t.spacing.md + 28,
    },
    deleteButton: {
      padding: t.spacing.sm,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
    },
  }));

  /** Tambah todo dari input; id = timestamp string (sementara). */
  const addTodo = () => {
    if (inputText.trim() === '') return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: inputText,
      isCompleted: false,
    };

    setTodos((prevTodos) => [...prevTodos, newTodo]);
    setInputText('');
  };

  /** Toggle checklist selesai / belum + haptic commit. */
  const toggleTodoComplete = useCallback((id: string) => {
    void hapticCommit('light');
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  }, []);

  /** Hapus satu todo + haptic warning. */
  const deleteTodo = useCallback((id: string) => {
    void hapticCommit('warning');
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  }, []);

  /** Logout lalu ganti stack ke login (replace agar back tidak ke home). */
  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const listHeader = (
    <>
      <View style={styles.header}>
        <View>
          <AppText variant="title" style={{ fontSize: theme.fontSize.xl }}>
            Daftar Tugas
          </AppText>
          <AppText
            variant="subtitle"
            color="secondaryLabel"
            style={styles.subtitle}
          >
            {user?.name
              ? `Halo, ${user.name}`
              : 'Kelola produktivitas harianmu'}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleSignOut}
            style={styles.logoutButton}
            accessibilityRole="button"
            accessibilityLabel="Keluar"
            hitSlop={theme.spacing.sm}
          >
            <AppText variant="link" color="destructive">
              Keluar
            </AppText>
          </Pressable>
          <ThemeToggle variant="icon" />
        </View>
      </View>

      <View style={styles.group}>
        <View style={styles.composerRow}>
          <TextInput
            placeholder="Tambah tugas baru..."
            placeholderTextColor={theme.colors.placeholderText}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={addTodo}
            returnKeyType="done"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tambah tugas"
            onPress={addTodo}
            style={({ pressed }) => [
              styles.addButton,
              { opacity: pressed ? theme.motion.press.opacity : 1 },
            ]}
          >
            <SymbolView
              name="plus"
              size={theme.fontSize.lg}
              tintColor={theme.colors.onPrimary}
              fallback={
                <AppText
                  color="onPrimary"
                  style={{ fontSize: theme.fontSize.xl }}
                >
                  +
                </AppText>
              }
            />
          </Pressable>
        </View>
      </View>
    </>
  );

  return (
    <Screen
      background="systemGroupedBackground"
      keyboard
      safe={{ top: true, bottom: true }}
      contentStyle={styles.root}
    >
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <AppText
            variant="subtitle"
            color="secondaryLabel"
            style={styles.emptyText}
          >
            Belum ada tugas hari ini. Santai dulu!
          </AppText>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === todos.length - 1;
          const isOnly = isFirst && isLast;

          return (
            <View
              style={[
                styles.todoRow,
                isOnly && styles.onlyRow,
                !isOnly && isFirst && styles.firstRow,
                !isOnly && isLast && styles.lastRow,
              ]}
            >
              <Pressable
                onPress={() => toggleTodoComplete(item.id)}
                style={styles.todoTextContainer}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.isCompleted }}
              >
                <SymbolView
                  name={item.isCompleted ? 'checkmark.circle.fill' : 'circle'}
                  size={theme.fontSize.xl}
                  tintColor={
                    item.isCompleted
                      ? theme.colors.primary
                      : theme.colors.secondaryLabel
                  }
                  fallback={
                    <AppText
                      variant="body"
                      color={item.isCompleted ? 'primary' : 'secondaryLabel'}
                    >
                      {item.isCompleted ? '✓' : '○'}
                    </AppText>
                  }
                />
                <AppText
                  variant="body"
                  color={item.isCompleted ? 'secondaryLabel' : 'label'}
                  style={item.isCompleted ? styles.todoCompleted : undefined}
                >
                  {item.text}
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => deleteTodo(item.id)}
                style={styles.deleteButton}
                accessibilityRole="button"
                accessibilityLabel="Hapus tugas"
                hitSlop={theme.spacing.sm}
              >
                <AppText variant="link" color="destructive">
                  Hapus
                </AppText>
              </Pressable>
            </View>
          );
        }}
      />
    </Screen>
  );
}
