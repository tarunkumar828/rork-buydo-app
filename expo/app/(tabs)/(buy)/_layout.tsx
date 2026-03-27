import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function BuyLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'To Buy' }} />
      <Stack.Screen name="[storeId]" options={{ title: 'Store' }} />
    </Stack>
  );
}
