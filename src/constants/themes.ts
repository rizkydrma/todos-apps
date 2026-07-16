// themes.ts
export const LightTheme = {
    background: "#ffffff",
    surface: "#f8fafc", // slate-50
    text: "#0f172a", // slate-900
    textMuted: "#64748b", // slate-500
    border: "#e2e8f0", // slate-200
    primary: "#007AFF", // Blue
    primaryDisabled: "#A2C4FF",
    error: "#FF3B30",
};

export const DarkTheme = {
    background: "#0f172a", // slate-900
    surface: "#1e293b", // slate-800
    text: "#ffffff",
    textMuted: "#94a3b8", // slate-400
    border: "#334155", // slate-700
    primary: "#3b82f6", // Blue lighter for dark mode
    primaryDisabled: "#1d4ed8",
    error: "#FF453A",
};

export type ThemeType = typeof LightTheme;
