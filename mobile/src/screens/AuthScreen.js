import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { validateLogin, validateRegister } from '../shared';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Field } from '../components/ui';
import { colors } from '../theme/theme';

export default function AuthScreen({ navigation, mode }) {
  const isRegister = mode === 'register';
  const { login, register, notice, setNotice } = useAuth();
  const [f, setF] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  async function submit() {
    const { errors: local } = (isRegister ? validateRegister : validateLogin)(f);
    if (local) return setErrors(local);
    setBusy(true); setErrors({}); setNotice('');
    try {
      if (isRegister) await register(f.fullName, f.email, f.password); else await login(f.email, f.password);
    } catch (e) {
      setErrors(e.details || { _: e.message });
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ink }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ padding: 28, paddingTop: 36 }}>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>TaskOrbit</Text>
            <Text style={{ color: '#b6bfe8', marginTop: 6 }}>Keep every project in orbit. Same account as the web app.</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.mist, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 16 }}>{isRegister ? 'Create your account' : 'Welcome back'}</Text>
            {!!notice && <View style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}><Banner text={notice} /></View>}
            {!!errors._ && <View style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}><Banner text={errors._} tone="coral" /></View>}
            {isRegister && <Field label="Full name" value={f.fullName} onChangeText={set('fullName')} error={errors.fullName} autoComplete="name" />}
            <Field label="Email" value={f.email} onChangeText={set('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <Field label="Password" value={f.password} onChangeText={set('password')} error={errors.password} secureTextEntry autoCapitalize="none" />
            {isRegister && <Text style={{ color: colors.ink3, marginBottom: 12 }}>At least 8 characters with a letter and a number.</Text>}
            <Button title={isRegister ? 'Create account' : 'Log in'} onPress={submit} loading={busy} />
            <Button variant="ghost" style={{ marginTop: 10 }} title={isRegister ? 'I already have an account' : 'Create an account'}
              onPress={() => { setNotice(''); navigation.navigate(isRegister ? 'Login' : 'Register'); }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
