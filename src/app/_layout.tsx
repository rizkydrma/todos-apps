import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

function NavigationLayout() {
    const { isDarkMode, theme } = useAppTheme();

    return (
        <>
            {/* Mengatur warna status bar baterai/jam di paling atas HP otomatis kontras */}
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <Stack
                initialRouteName="(main)/home"
                screenOptions={{
                    headerStyle: { backgroundColor: theme.surface },
                    headerTintColor: theme.text,
                    headerShadowVisible: false, // Menghilangkan garis bawah header agar clean
                    contentStyle: { backgroundColor: theme.background }, // Background dasar semua screen
                }}
            >
                {/* Halaman group auth kita sembunyikan headernya */}
                <Stack.Screen
                    options={{ headerShown: false }}
                    name="(auth)/login"
                />
                <Stack.Screen
                    options={{ headerShown: false }}
                    name="(auth)/register"
                />

                {/* Halaman home kita beri judul kustom di header bawaan */}
                <Stack.Screen
                    name="(main)/home"
                    options={{ title: "Beranda" }}
                />
            </Stack>
        </>
    );
}

// Wrapping layout navigasi dengan ThemeProvider
export default function RootLayout() {
    return (
        <ThemeProvider>
            <NavigationLayout />
        </ThemeProvider>
    );
}
