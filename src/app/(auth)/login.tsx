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
                        <CustomInputField
                            control={control}
                            name="email"
                            placeholder="Email"
                            error={errors.email?.message}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() =>
                                passwordInputRef.current?.focus()
                            }
                            submitBehavior="submit"
                        />

                        <CustomInputField
                            innerRef={passwordInputRef}
                            control={control}
                            name="password"
                            placeholder="Password"
                            error={errors.password?.message}
                            secureTextEntry
                            returnKeyType="go"
                            onSubmitEditing={handleSubmit(onSubmit)}
                        />

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
