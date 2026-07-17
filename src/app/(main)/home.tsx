import { AppText, ThemeToggle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';

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
    inputContainer: {
      flexDirection: 'row' as const,
      marginBottom: t.spacing.md,
      alignItems: 'center' as const,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      paddingVertical: t.spacing.sm + t.spacing.xs,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.lg,
      fontSize: t.fontSize.md,
      marginRight: t.spacing.sm,
      minHeight: t.size.controlHeight,
    },
    addButton: {
      width: t.size.iconButton,
      height: t.size.iconButton,
      borderRadius: t.radius.full,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    addButtonLabel: {
      fontSize: t.fontSize.xl,
    },
    listContainer: {
      paddingBottom: t.spacing.lg,
    },
    emptyText: {
      textAlign: 'center' as const,
      marginTop: t.spacing.xxl,
    },
    todoItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: t.spacing.md,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      marginBottom: t.spacing.sm,
    },
    todoTextContainer: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    completeMark: {
      marginRight: t.spacing.sm,
    },
    todoCompleted: {
      textDecorationLine: 'line-through' as const,
    },
    deleteButton: {
      padding: t.spacing.sm,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
    },
    deleteLabel: {
      fontSize: t.fontSize.sm,
      fontWeight: t.fontWeight.semibold,
    },
  }));

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

  const toggleTodoComplete = (id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <AppText variant="title" style={{ fontSize: theme.fontSize.xl }}>
            Daftar Tugas
          </AppText>
          <AppText variant="subtitle" color="textMuted" style={styles.subtitle}>
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
            <AppText variant="link" color="error">
              Keluar
            </AppText>
          </Pressable>
          <ThemeToggle variant="icon" />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Tambah tugas baru..."
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
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
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <AppText
            variant="title"
            color="onPrimary"
            style={styles.addButtonLabel}
          >
            +
          </AppText>
        </Pressable>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <AppText
            variant="subtitle"
            color="textMuted"
            style={styles.emptyText}
          >
            Belum ada tugas hari ini. Santai dulu!
          </AppText>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.todoItem,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => toggleTodoComplete(item.id)}
              style={styles.todoTextContainer}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.isCompleted }}
            >
              <AppText
                variant="body"
                color={item.isCompleted ? 'primary' : 'textMuted'}
                style={styles.completeMark}
              >
                {item.isCompleted ? '✓' : '○'}
              </AppText>
              <AppText
                variant="body"
                color={item.isCompleted ? 'textMuted' : 'text'}
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
              <AppText variant="link" color="error" style={styles.deleteLabel}>
                Hapus
              </AppText>
            </Pressable>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}
