import { Alert, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import { API_URL } from '../api/config';
import { colors } from '../theme/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={{ padding: 16, gap: 16 }}>
      <View style={{ backgroundColor: colors.paper, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.line, gap: 4 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink }}>{user.fullName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>{user.fullName}</Text>
        <Text style={{ color: colors.ink2 }}>{user.email}</Text>
        <Text style={{ color: colors.ink3, marginTop: 8, fontSize: 12 }}>Reminders for tasks due tomorrow arrive at 9:00 the day before.</Text>
        <Text style={{ color: colors.ink3, fontSize: 12 }}>Server: {API_URL}</Text>
      </View>
      <Button title="Log out" variant="ghost" onPress={() => Alert.alert('Log out?', 'Saved offline data will be cleared from this device.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }])} />
    </View>
  );
}
