import { useAppTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface TodoItem {
    id: string;
    text: string;
    isCompleted: boolean;
}

export default function Home() {
    const router = useRouter();
    const { theme, toggleTheme, isDarkMode } = useAppTheme();

    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [inputText, setInputText] = useState("");

    const addTodo = () => {
        if (inputText.trim() === "") return;

        const newTodo: TodoItem = {
            id: Date.now().toString(),
            text: inputText,
            isCompleted: false,
        };

        setTodos((prevTodos) => [...prevTodos, newTodo]);
        setInputText("");
    };

    const toggleTodoComplete = (id: string) => {
        setTodos((prevTodos) =>
            prevTodos.map((todo) =>
                todo.id === id
                    ? { ...todo, isCompleted: !todo.isCompleted }
                    : todo,
            ),
        );
    };

    const deleteTodo = (id: string) => {
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    };

    const handleLogOut = () => {
        router.replace("/(auth)/login");
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.welcomeText, { color: theme.text }]}>
                        Daftar Tugas 📝
                    </Text>
                    <Text
                        style={[
                            styles.subtitleText,
                            { color: theme.textMuted },
                        ]}
                    >
                        Kelola produktivitas harianmu
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={toggleTheme}
                    style={[
                        styles.themeButton,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                        },
                    ]}
                >
                    <Text style={{ color: theme.text, fontSize: 18 }}>
                        {isDarkMode ? "🌙" : "☀️"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* FORM INPUT TODO BARU */}
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Tambah tugas baru..."
                    placeholderTextColor={theme.textMuted}
                    style={[
                        styles.input,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text,
                        },
                    ]}
                    value={inputText}
                    onChangeText={setInputText}
                />
                <TouchableOpacity
                    onPress={addTodo}
                    style={[
                        styles.addButton,
                        { backgroundColor: theme.primary },
                    ]}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* TODO LIST */}
            <FlatList
                data={todos}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text
                        style={[styles.emptyText, { color: theme.textMuted }]}
                    >
                        Belum ada tugas hari ini. Santai dulu!
                    </Text>
                }
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.todoItem,
                            {
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => toggleTodoComplete(item.id)}
                            style={styles.todoTextContainer}
                        >
                            <Text
                                style={[
                                    styles.todoText,
                                    { color: theme.text },
                                    item.isCompleted && [
                                        styles.todoTextCompleted,
                                        { color: theme.textMuted },
                                    ],
                                ]}
                            >
                                {item.isCompleted ? "✅ " : "⬜ "} {item.text}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => deleteTodo(item.id)}
                            style={styles.deleteButton}
                        >
                            <Text
                                style={{
                                    color: theme.error,
                                    fontWeight: "bold",
                                }}
                            >
                                Hapus
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        marginTop: 10,
    },
    welcomeText: { fontSize: 24, fontWeight: "bold" },
    subtitleText: { fontSize: 14, marginTop: 4 },
    themeButton: { padding: 10, borderRadius: 8, borderWidth: 1 },
    inputContainer: { flexDirection: "row", marginBottom: 20 },
    input: {
        flex: 1,
        borderWidth: 1,
        padding: 14,
        borderRadius: 8,
        fontSize: 16,
        marginRight: 10,
    },
    addButton: {
        width: 50,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    addButtonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    listContainer: { paddingBottom: 20 },
    emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },
    todoItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 12,
    },
    todoTextContainer: { flex: 1 },
    todoText: { fontSize: 16, fontWeight: "500" },
    todoTextCompleted: { textDecorationLine: "line-through" },
    deleteButton: { padding: 6 },
    logoutButton: {
        alignItems: "center",
        paddingVertical: 16,
        marginBottom: 10,
    },
    logoutButtonText: { fontSize: 14, fontWeight: "600" },
});
