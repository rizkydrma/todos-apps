/**
 * Control pemilihan opsi — pola mengikuti jumlah pilihan (bukan one-size-fits-all).
 *
 * Aturan:
 * - 2 opsi  → Segmented control (banding langsung, 1 tap, hemat tinggi)
 * - 3+ opsi → List check rows (scan vertikal, checkmark HIG)
 *
 * Kenapa: 2-item list terasa kosong & lambat; 8-item segmented tidak terbaca.
 */
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

export type OptionItem<T> = {
  value: T;
  label: string;
};

export type OptionControlProps<T> = {
  /** Label section (caption di atas control). */
  title: string;
  options: OptionItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Force mode. Default: otomatis dari options.length.
   * 2 → segment, 3+ → list.
   */
  mode?: 'auto' | 'segment' | 'list';
};

/**
 * Resolusi mode: 2 = segment, selain itu list.
 * 0–1 opsi: list (edge case, tetap render aman).
 */
export function resolveOptionMode(
  count: number,
  mode: 'auto' | 'segment' | 'list' = 'auto'
): 'segment' | 'list' {
  if (mode !== 'auto') return mode;
  return count === 2 ? 'segment' : 'list';
}

/**
 * Segmented control untuk tepat 2 pilihan (equal weight, side-by-side).
 */
function SegmentedControl<T>({
  options,
  value,
  onChange,
}: {
  options: OptionItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    track: {
      flexDirection: 'row' as const,
      padding: 3,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.tertiarySystemFill,
      gap: 2,
    },
    segment: {
      flex: 1,
      minHeight: t.size.touchMin - 6,
      borderRadius: t.radius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: t.spacing.sm,
    },
    segmentOn: {
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      // Selected pill elevation subtle
      shadowColor: t.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
  }));

  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((opt) => {
        const selected = Object.is(opt.value, value);
        return (
          <Pressable
            key={String(opt.label)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentOn,
              pressed && !selected
                ? { opacity: theme.motion.press.opacity }
                : null,
            ]}
          >
            <AppText
              variant="label"
              color={selected ? 'label' : 'secondaryLabel'}
              numberOfLines={1}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * List rows + checkmark untuk 3+ opsi.
 */
function OptionList<T>({
  options,
  value,
  onChange,
}: {
  options: OptionItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    card: {
      borderRadius: t.radius.xl,
      overflow: 'hidden' as const,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.separator,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      minHeight: t.size.touchMin,
      paddingHorizontal: t.spacing.md,
      gap: t.spacing.sm,
    },
    sep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.colors.separator,
      marginLeft: t.spacing.md,
    },
    label: { flex: 1 },
  }));

  return (
    <View style={styles.card}>
      {options.map((opt, i) => {
        const selected = Object.is(opt.value, value);
        const isLast = i === options.length - 1;
        return (
          <View key={String(opt.label)}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.row,
                pressed ? { opacity: theme.motion.press.opacity } : null,
              ]}
            >
              <AppText
                variant="body"
                color={selected ? 'primary' : 'label'}
                style={styles.label}
              >
                {opt.label}
              </AppText>
              {selected ? (
                <Check
                  size={20}
                  color={theme.colors.primary}
                  strokeWidth={2.4}
                />
              ) : (
                <View style={{ width: 20 }} />
              )}
            </Pressable>
            {!isLast ? <View style={styles.sep} /> : null}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Section berjudul + control yang tepat untuk cardinality opsi.
 */
export function OptionControl<T>({
  title,
  options,
  value,
  onChange,
  mode = 'auto',
}: OptionControlProps<T>) {
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    title: {
      marginBottom: t.spacing.xs,
      marginLeft: t.spacing.xs,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      fontSize: t.fontSize.xs,
    },
  }));

  const resolved = resolveOptionMode(options.length, mode);

  if (options.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color="secondaryLabel" style={styles.title}>
        {title}
      </AppText>
      {resolved === 'segment' ? (
        <SegmentedControl options={options} value={value} onChange={onChange} />
      ) : (
        <OptionList options={options} value={value} onChange={onChange} />
      )}
    </View>
  );
}
