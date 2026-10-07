// Set EXPO_PUBLIC_API_URL in .env (dev) or eas.json (APK build). 10.0.2.2 = host PC from the Android emulator.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000').replace(/\/$/, '');
