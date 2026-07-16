import { useAppTheme } from "@/context/ThemeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import * as z from "zod";

const loginSchema = z.object({
    email: z
        .email("Format email tidak valid")
        .min(1, "Email tidak boleh kosong"),
    password: z.string().min(6, "Paswword terlalu pendek"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const { theme, toggleTheme, isDarkMode } = useAppTheme();

    const router = useRouter();
    const passwordInputRef = useRef<TextInput>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onChange",
    });

    const onSubmit = (data: LoginFormValues) => {
        console.log("Data :", data);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.innerContainer}>
                    {/* Switcher Theme */}
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={styles.themeButton}
                    >
                        <Text
                            style={[
                                styles.themeButtonText,
                                { color: theme.primary },
                            ]}
                        >
                            {isDarkMode ? "Light" : "Dark"}
                        </Text>
                    </TouchableOpacity>

                    {/*Header Logo*/}
                    <View style={styles.logoContainer}>
                        <Text style={[styles.logoText, { color: theme.text }]}>
                            Just Todos
                        </Text>
                        <Text
                            style={[
                                styles.subtitleText,
                                { color: theme.textMuted },
                            ]}
                        >
                            Silahkan masuk ke akun Anda
                        </Text>
                    </View>

                    {/*Form Area*/}
                    <View style={styles.formContainer}>
                        <View>
                            <Controller
                                control={control}
                                name="email"
                                render={({
                                    field: { onChange, value, onBlur },
                                }) => (
                                    <TextInput
                                        placeholder="Email"
                                        placeholderTextColor={theme.textMuted}
                                        onChangeText={onChange}
                                        value={value}
                                        onBlur={onBlur}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        onSubmitEditing={() =>
                                            passwordInputRef.current?.focus()
                                        }
                                        submitBehavior="submit"
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: theme.surface,
                                                borderColor: theme.border,
                                                color: theme.text,
                                            },
                                            errors.email && {
                                                borderColor: theme.error,
                                            },
                                        ]}
                                    />
                                )}
                            />

                            {errors.email && (
                                <Text
                                    style={[
                                        styles.errorText,
                                        { color: theme.error },
                                    ]}
                                >
                                    {errors?.email?.message}
                                </Text>
                            )}
                        </View>

                        <View>
                            <Controller
                                control={control}
                                name="password"
                                render={({
                                    field: { onChange, value, onBlur },
                                }) => (
                                    <TextInput
                                        placeholder="Password"
                                        placeholderTextColor={theme.textMuted}
                                        onChangeText={onChange}
                                        value={value}
                                        onBlur={onBlur}
                                        secureTextEntry
                                        returnKeyType="go"
                                        onSubmitEditing={handleSubmit(onSubmit)}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: theme.surface,
                                                borderColor: theme.border,
                                                color: theme.text,
                                            },
                                            errors.email && {
                                                borderColor: theme.error,
                                            },
                                        ]}
                                    />
                                )}
                            />

                            {errors?.password && (
                                <Text
                                    style={[
                                        styles.errorText,
                                        { color: theme.error },
                                    ]}
                                >
                                    {errors?.password?.message}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: theme.primary },
                                !isValid && {
                                    backgroundColor: theme.primaryDisabled,
                                },
                            ]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={!isValid}
                        >
                            <Text style={styles.buttonText}>Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.push(`/(auth)/register`)}
                        >
                            <Text
                                style={[
                                    styles.linkText,
                                    { color: theme.primary },
                                ]}
                            >
                                Belum punya akun? Daftar di sini
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    innerContainer: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    themeButton: { position: "absolute", top: 60, right: 24, padding: 8 },
    themeButtonText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    logoText: {
        fontSize: 32,
        fontWeight: "bold",
    },
    subtitleText: {
        fontSize: 14,
        marginTop: 8,
    },
    formContainer: {
        width: "100%",
    },
    input: {
        borderWidth: 1,
        padding: 14,
        borderRadius: 8,
        marginTop: 16,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: "500",
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    linkButton: {
        marginTop: 20,
        alignItems: "center",
    },
    linkText: {
        fontSize: 14,
        fontWeight: "600",
    },
});
