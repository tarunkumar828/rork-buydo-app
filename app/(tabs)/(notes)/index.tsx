import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSmartList } from '@/hooks/useSmartListStore';
import NoteCard from '@/components/NoteCard';
import EmptyState from '@/components/EmptyState';
import FAB from '@/components/FAB';

export default function NotesScreen() {
  const router = useRouter();
  const { notes, addNote, deleteNote } = useSmartList();

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes]);

  const handleAdd = () => {
    const newNote = addNote('Untitled Note');
    if (newNote) {
      router.push(`/${newNote.id}` as never);
    }
  };

  const handleDelete = (noteId: string, title: string) => {
    Alert.alert('Delete Note', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deleteNote(noteId);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedNotes.length > 0 && (
          <Text style={styles.count}>{sortedNotes.length} note{sortedNotes.length !== 1 ? 's' : ''}</Text>
        )}
        {sortedNotes.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No notes yet"
            subtitle="Tap + to create your first note"
          />
        ) : (
          sortedNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onPress={() => router.push(`/${note.id}` as never)}
              onDelete={() => handleDelete(note.id, note.title)}
            />
          ))
        )}
      </ScrollView>

      <FAB onPress={handleAdd} testID="add-note-fab" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  count: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 12,
    fontWeight: '500' as const,
  },
});
