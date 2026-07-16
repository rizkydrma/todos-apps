import { useAppTheme } from "@/context/ThemeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Keyboard,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import z from "zod";

const registerSchema = z
    .object({
        name: z.string().min(1, "Nama tidak boleh kosong"),
        email: z.email("Format email salah"),
        password: z.string().min(6, "Minimal 6 karakter"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password tidak cocok",
        path: ["confirmPassword"], // Pesan error akan ditempelkan di kolom confirmPassword
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();

    // Reference auto focus input
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        mode: "onChange",
    });

    const onSubmit = (data: RegisterFormValues) => {
        console.log(`Register berhasil`, data);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.logoContainer}>
                        <Text style={[styles.logoText, { color: theme.text }]}>
                            Buat Akun
                        </Text>
                        <Text
                            style={[
                                styles.subtitleText,
                                { color: theme.textMuted },
                            ]}
                        >
                            Gabung bersama sekarang
                        </Text>
                    </View>

                    {/*FORM INPUT*/}
                    <View>
                        <View>
                            <Controller
                                control={control}
                                name="name"
                                render={({
                                    field: { value, onBlur, onChange },
                                }) => (
                                    <TextInput
                                        placeholder="Nama Lengkap"
                                        placeholderTextColor={theme.textMuted}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        returnKeyType="next"
                                        onSubmitEditing={() =>
                                            emailInputRef.current?.focus()
                                        }
                                        submitBehavior="submit"
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: theme.surface,
                                                borderColor: theme.border,
                                                color: theme.text,
                                            },
                                            errors?.email && {
                                                borderColor: theme.error,
                                            },
                                        ]}
                                    />
                                )}
                            />
                            {errors.name && (
                                <Text>{errors?.name?.message}</Text>
                            )}
                        </View>

                        <View>
                            <Controller
                                control={control}
                                name="email"
                                render={({
                                    field: { value, onBlur, onChange },
                                }) => (
                                    <TextInput
                                        ref={emailInputRef}
                                        placeholder="Email"
                                        placeholderTextColor={theme.textMuted}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
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
                                            errors?.email && {
                                                borderColor: theme.error,
                                            },
                                        ]}
                                    />
                                )}
                            />
                            {errors.email && (
                                <Text>{errors?.email?.message}</Text>
                            )}
                        </View>

                        <View>
                            <Controller
                                control={control}
                                name="password"
                                render={({
                                    field: { value, onBlur, onChange },
                                }) => (
                                    <TextInput
                                        ref={passwordInputRef}
                                        placeholder="Password"
                                        placeholderTextColor={theme.textMuted}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        returnKeyType="next"
                                        onSubmitEditing={() =>
                                            confirmPasswordInputRef.current?.focus()
                                        }
                                        submitBehavior="submit"
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: theme.surface,
                                                borderColor: theme.border,
                                                color: theme.text,
                                            },
                                            errors?.email && {
                                                borderColor: theme.error,
                                            },
                                        ]}
                                    />
                                )}
                            />
                            {errors.password && (
                                <Text>{errors?.password?.message}</Text>
                            )}
                        </View>

                        <View>
                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({
                                    field: { onChange, onBlur, value },
                                }) => (
                                    <TextInput
                                        ref={confirmPasswordInputRef}
                                        placeholder="Konfirmasi Password"
                                        placeholderTextColor={theme.textMuted}
                                        secureTextEntry
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        returnKeyType="go"
                                        onSubmitEditing={handleSubmit(onSubmit)}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: theme.surface,
                                                borderColor: theme.border,
                                                color: theme.text,
                                            },
                                            errors?.email && {
                                                borderColor: theme.error,
                                            },
                                        ]}
                                    />
                                )}
                            />
                            {errors?.confirmPassword && (
                                <Text>{errors?.confirmPassword?.message}</Text>
                            )}
                        </View>

                        {/* REGISTER */}
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
                            <Text style={styles.buttonText}>
                                Daftar Sekarang
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.linkButton}
                        >
                            <Text
                                style={[
                                    styles.linkText,
                                    { color: theme.primary },
                                ]}
                            >
                                Sudah punya akun? Login disini
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    logoContainer: { alignItems: "center", marginBottom: 32 },
    logoText: { fontSize: 32, fontWeight: "bold" },
    subtitleText: { fontSize: 14, marginTop: 8, textAlign: "center" },
    formContainer: { width: "100%" },
    input: {
        borderWidth: 1,
        padding: 14,
        borderRadius: 8,
        marginTop: 16,
        fontSize: 16,
    },
    errorText: { fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: "500" },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 28,
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    linkButton: { marginTop: 20, alignItems: "center" },
    linkText: { fontSize: 14, fontWeight: "600" },
});
