import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function NotesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Notes' }} />
      <Stack.Screen name="[noteId]" options={{ title: 'Edit Note' }} />
    </Stack>
  );
}
