import { useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { refreshReminders } from './src/notifications';
import { Loading } from './src/components/ui';
import { colors } from './src/theme/theme';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import ProjectFormScreen from './src/screens/ProjectFormScreen';
import TasksScreen from './src/screens/TasksScreen';
import TaskFormScreen from './src/screens/TaskFormScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.mist, primary: colors.blue, card: colors.paper, text: colors.ink, border: colors.line } };
const header = { headerTitleStyle: { fontWeight: '800', color: colors.ink }, headerShadowVisible: false };

const icons = { Dashboard: 'speedometer-outline', Projects: 'folder-open-outline', Tasks: 'checkbox-outline', Account: 'person-circle-outline' };

function Tabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...header, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: colors.ink3,
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
    })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Projects" component={ProjectsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: 'My tasks' }} />
      <Tab.Screen name="Account" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refreshReminders(); });
    return () => sub.remove();
  }, []);
  return (
    <Stack.Navigator screenOptions={header}>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ProjectForm" component={ProjectFormScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">{(p) => <AuthScreen {...p} mode="login" />}</Stack.Screen>
      <Stack.Screen name="Register">{(p) => <AuthScreen {...p} mode="register" />}</Stack.Screen>
    </Stack.Navigator>
  );
}

function Root() {
  const { user, booting } = useAuth();
  if (booting) return <Loading label="Starting TaskOrbit" />;
  return (
    <NavigationContainer theme={theme}>
      {user ? <AppStack /> : <AuthStack />}
      <StatusBar style={user ? 'dark' : 'light'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
