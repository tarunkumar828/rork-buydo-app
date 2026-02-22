import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSmartList } from '@/hooks/useSmartListStore';

export default function NoteEditorScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const router = useRouter();
  const { notes, updateNote, deleteNote } = useSmartList();

  const note = notes.find(n => n.id === noteId);
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.id]);

  useEffect(() => {
    if (!noteId) return;
    const timer = setTimeout(() => {
      if (title !== note?.title || content !== note?.content) {
        updateNote(noteId, title, content);
        console.log('Note auto-saved:', noteId);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title, content, noteId]);

  const handleDelete = () => {
    Alert.alert('Delete Note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (noteId) deleteNote(noteId);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Trash2 size={20} color={Colors.danger} />
            </TouchableOpacity>
          ),
        }}
      />
      <TextInput
        style={styles.title}
        value={title}
        onChangeText={setTitle}
        placeholder="Note title"
        placeholderTextColor={Colors.textTertiary}
        returnKeyType="next"
      />
      <TextInput
        style={styles.content}
        value={content}
        onChangeText={setContent}
        placeholder="Start writing..."
        placeholderTextColor={Colors.textTertiary}
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.autosave}>Auto-saves as you type</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  content: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    paddingTop: 16,
  },
  autosave: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center' as const,
    paddingVertical: 12,
  },
});
