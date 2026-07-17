import { AppText, ThemeToggle } from '@/components/ui';
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
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
  const { theme } = useAppTheme();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputText, setInputText] = useState('');

  const styles = useThemedStyles((t) => ({
    root: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: t.spacing.lg,
      marginTop: 10,
    },
    subtitle: {
      marginTop: t.spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row' as const,
      marginBottom: 20,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      padding: 14,
      borderRadius: t.radius.sm,
      fontSize: t.fontSize.md,
      marginRight: 10,
    },
    addButton: {
      width: t.size.iconButton,
      borderRadius: t.radius.sm,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    listContainer: {
      paddingBottom: 20,
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
      borderRadius: t.radius.sm,
      borderWidth: 1,
      marginBottom: 12,
    },
    todoTextContainer: {
      flex: 1,
    },
    todoCompleted: {
      textDecorationLine: 'line-through' as const,
    },
    deleteButton: {
      padding: 6,
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <AppText variant="title" style={{ fontSize: theme.fontSize.xl }}>
            Daftar Tugas 📝
          </AppText>
          <AppText variant="subtitle" color="textMuted" style={styles.subtitle}>
            Kelola produktivitas harianmu
          </AppText>
        </View>
        <ThemeToggle variant="icon" />
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
          <AppText variant="title" color="onPrimary" style={{ fontSize: 24 }}>
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
                color={item.isCompleted ? 'textMuted' : 'text'}
                style={item.isCompleted ? styles.todoCompleted : undefined}
              >
                {item.isCompleted ? '✅ ' : '⬜ '} {item.text}
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => deleteTodo(item.id)}
              style={styles.deleteButton}
              accessibilityRole="button"
              accessibilityLabel="Hapus tugas"
              hitSlop={8}
            >
              <AppText
                variant="link"
                color="error"
                style={{ fontWeight: '700' }}
              >
                Hapus
              </AppText>
            </Pressable>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}
