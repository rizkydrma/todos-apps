/**
 * Hub Admin — navigasi ke Categories / Tags / Users.
 */
import { AppText, Screen } from '@/components/ui';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

const LINKS = [
  { href: '/(main)/(tabs)/admin/categories' as const, title: 'Kategori' },
  { href: '/(main)/(tabs)/admin/tags' as const, title: 'Tags' },
  { href: '/(main)/(tabs)/admin/users' as const, title: 'Users' },
];

export default function AdminHubScreen() {
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.md },
    group: {
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderRadius: t.radius.xl,
      overflow: 'hidden' as const,
    },
    row: {
      padding: t.spacing.md,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.separator,
    },
  }));

  return (
    <Screen background="systemGroupedBackground" safe={{ top: false }}>
      <View style={styles.content}>
        <AppText
          variant="subtitle"
          color="secondaryLabel"
          style={{ marginBottom: 12 }}
        >
          Kelola katalog & pengguna
        </AppText>
        <View style={styles.group}>
          {LINKS.map((link, i) => (
            <Pressable
              key={link.href}
              style={[
                styles.row,
                i === LINKS.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => router.push(link.href)}
            >
              <AppText variant="body">{link.title}</AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
