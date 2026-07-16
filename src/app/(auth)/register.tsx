import CustomInputField from "@/components/CustomInputField";
import { useAppTheme } from "@/context/ThemeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
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
                        <CustomInputField
                            control={control}
                            name="name"
                            placeholder="Nama Lengkap"
                            returnKeyType="next"
                            autoCapitalize="none"
                            error={errors.name?.message}
                            submitBehavior="submit"
                            onSubmitEditing={() =>
                                emailInputRef.current?.focus()
                            }
                        />

                        <CustomInputField
                            innerRef={emailInputRef}
                            control={control}
                            name="email"
                            placeholder="Email"
                            error={errors.email?.message}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            returnKeyType="next"
                            submitBehavior="submit"
                            onSubmitEditing={() =>
                                passwordInputRef.current?.focus()
                            }
                        />

                        <CustomInputField
                            innerRef={passwordInputRef}
                            control={control}
                            name="password"
                            placeholder="Password"
                            error={errors.password?.message}
                            secureTextEntry
                            returnKeyType="go"
                            onSubmitEditing={() =>
                                confirmPasswordInputRef.current?.focus()
                            }
                        />

                        <CustomInputField
                            innerRef={confirmPasswordInputRef}
                            control={control}
                            name="password"
                            placeholder="Password"
                            error={errors.password?.message}
                            secureTextEntry
                            returnKeyType="go"
                            onSubmitEditing={() =>
                                confirmPasswordInputRef.current?.focus()
                            }
                        />

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
