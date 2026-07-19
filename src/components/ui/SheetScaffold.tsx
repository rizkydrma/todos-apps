/**
 * Chrome layout di atas BottomSheet: header (title + trailing) · body scroll · footer.
 *
 * BottomSheet = material + motion + Modal.
 * SheetScaffold = pola produk (filter, form, dsb.) supaya chrome konsisten.
 *
 * Body default ScrollView + keyboardShouldPersistTaps (K1).
 */
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { BottomSheet, type BottomSheetProps } from './BottomSheet';

export type SheetScaffoldProps = {
  visible: boolean;
  onClose: () => void;
  /** Judul baris header (headline). */
  title: string;
  /** Opsional di bawah title. */
  subtitle?: string;
  /** Aksi kanan header (mis. Clear all). */
  trailing?: ReactNode;
  /** Konten body — di dalam ScrollView bila scrollable. */
  children: ReactNode;
  /** Sticky di bawah body (mis. tombol primary). */
  footer?: ReactNode;
  /** Default true — body di ScrollView. */
  scrollable?: boolean;
  maxHeightRatio?: BottomSheetProps['maxHeightRatio'];
  edgeInset?: BottomSheetProps['edgeInset'];
  /** Style tambahan pada content container body. */
  bodyStyle?: StyleProp<ViewStyle>;
  style?: BottomSheetProps['style'];
};

/**
 * Presentasi sheet ber-chrome: title row + scroll body + footer.
 */
export function SheetScaffold({
  visible,
  onClose,
  title,
  subtitle,
  trailing,
  children,
  footer,
  scrollable = true,
  maxHeightRatio = 0.88,
  edgeInset,
  bodyStyle,
  style,
}: SheetScaffoldProps) {
  const styles = useThemedStyles((t) => ({
    root: {
      // Batasi tinggi di dalam sheet maxHeight supaya ScrollView bisa scroll
      flexGrow: 0,
      flexShrink: 1,
    },
    header: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.md,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.sm,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    trailing: {
      paddingTop: 2,
      justifyContent: 'center' as const,
    },
    body: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.md,
    },
    footer: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.separator,
    },
  }));

  const body = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.body, bodyStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, bodyStyle]}>{children}</View>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      maxHeightRatio={maxHeightRatio}
      edgeInset={edgeInset}
      style={style}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <AppText variant="headline" numberOfLines={2}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText
                variant="caption"
                color="secondaryLabel"
                numberOfLines={2}
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </View>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </BottomSheet>
  );
}
