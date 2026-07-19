/**
 * Baris todo dengan swipe commit (otomatis, tanpa tap kedua):
 * - Swipe kanan (buka left actions) → Selesai
 * - Swipe kiri (buka right actions) → Hapus (parent tetap confirm)
 * - Tap / pensil → edit
 *
 * Reveal button tetap ada sebagai affordance visual + fallback a11y.
 */
import { AppText, Badge } from '@/components/ui';
import { useAppTheme } from '@/context/ThemeContext';
import type { TodoWithRelations } from '@/features/todos/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Check, Pencil, Trash2 } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

export type TodoSwipeRowProps = {
  item: TodoWithRelations;
  isLast: boolean;
  onToggleComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

/**
 * Satu baris list: full-open swipe = commit aksi; tap = edit.
 */
export function TodoSwipeRow({
  item,
  isLast,
  onToggleComplete,
  onDelete,
  onEdit,
}: TodoSwipeRowProps) {
  const { theme } = useAppTheme();
  const swipeRef = useRef<Swipeable>(null);
  /** Cegah double-fire open + tap pada frame yang sama. */
  const committingRef = useRef(false);

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: t.spacing.md,
      gap: t.spacing.sm,
      minHeight: t.size.touchMin,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
    },
    rowBody: { flex: 1, gap: 2, minWidth: 0 },
    meta: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.xs,
      marginTop: 4,
    },
    iconBtn: {
      minWidth: t.size.touchMin,
      minHeight: t.size.touchMin,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.colors.separator,
      marginLeft: t.spacing.md,
      opacity: 0.5,
    },
    action: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      width: 84,
      height: '100%' as const,
    },
    actionComplete: {
      backgroundColor: t.colors.systemGreen,
    },
    actionDelete: {
      backgroundColor: t.colors.destructive,
    },
    actionLabel: {
      marginTop: 4,
      color: t.colors.onPrimary,
      fontSize: t.fontSize.xs,
      fontWeight: t.fontWeight.semibold,
    },
  }));

  const close = () => swipeRef.current?.close();

  /**
   * Commit aksi setelah row fully open (lewat threshold).
   * direction dari RNGH: 'left' = left actions terbuka (swipe kanan),
   * 'right' = right actions terbuka (swipe kiri).
   */
  const commitFromOpen = (direction: 'left' | 'right') => {
    if (committingRef.current) return;
    committingRef.current = true;
    close();
    if (direction === 'left') {
      onToggleComplete();
    } else {
      onDelete();
    }
    // Reset setelah frame — row bisa di-swipe lagi setelah list update
    requestAnimationFrame(() => {
      committingRef.current = false;
    });
  };

  const renderLeftActions = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tandai selesai"
      onPress={() => {
        if (committingRef.current) return;
        close();
        onToggleComplete();
      }}
      style={[styles.action, styles.actionComplete]}
    >
      <Check size={22} color={theme.colors.onPrimary} strokeWidth={2.4} />
      <AppText style={styles.actionLabel}>Selesai</AppText>
    </Pressable>
  );

  const renderRightActions = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Hapus todo"
      onPress={() => {
        if (committingRef.current) return;
        close();
        onDelete();
      }}
      style={[styles.action, styles.actionDelete]}
    >
      <Trash2 size={22} color={theme.colors.onPrimary} strokeWidth={2.2} />
      <AppText style={styles.actionLabel}>Hapus</AppText>
    </Pressable>
  );

  return (
    <View>
      <Swipeable
        ref={swipeRef}
        friction={2}
        overshootFriction={8}
        // Threshold rendah: lepas setelah lewat ~40px → open + auto-commit
        leftThreshold={40}
        rightThreshold={40}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        overshootLeft={false}
        overshootRight={false}
        onSwipeableOpen={commitFromOpen}
      >
        <Pressable style={styles.row} onPress={onEdit}>
          <View style={styles.rowBody}>
            <AppText
              variant="body"
              color={item.completed ? 'secondaryLabel' : 'label'}
              style={
                item.completed
                  ? { textDecorationLine: 'line-through' }
                  : undefined
              }
              numberOfLines={2}
            >
              {item.title}
            </AppText>
            <View style={styles.meta}>
              <Badge label={item.priority} size="sm" />
              {item.category ? (
                <Badge label={item.category.name} size="sm" />
              ) : null}
              {item.dueDate ? (
                <Badge
                  label={new Date(item.dueDate).toLocaleDateString()}
                  size="sm"
                />
              ) : null}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit todo"
            onPress={onEdit}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Pencil
              size={18}
              color={theme.colors.secondaryLabel}
              strokeWidth={2.2}
            />
          </Pressable>
        </Pressable>
      </Swipeable>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}
