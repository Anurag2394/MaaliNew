import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getUserSession } from '@/utiles/auth';  // Assuming you have a function to check login status

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in (from storage, context, etc.)
    const checkLoginStatus = async () => {
      const userSession = await getUserSession();  // You need to implement this check
      setIsLoggedIn(!!userSession); // Update state based on session
    };

    if (loaded) {
      checkLoginStatus();
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null; // Prevent rendering until fonts are loaded
  }

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {isLoggedIn ? (
            // Main App Screens (Only show this if logged in)
            <>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="product" options={{ title: 'Products' }} />
              <Stack.Screen name="login" options={{ title: 'login' }} />
              <Stack.Screen name="+not-found" />
            </>
          ) : (
            // Show Login Flow (If Not Logged In)
            <>
              <Stack.Screen name="login" options={{ presentation: 'modal' }} />
              {/* <Stack.Screen name="signin" options={{ presentation: 'modal' }} />
              <Stack.Screen name="signup" options={{ presentation: 'modal' }} /> */}
            </>
          )}
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
