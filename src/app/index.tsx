import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { status } = useAuth();

  if (status === 'bootstrapping') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/(main)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
