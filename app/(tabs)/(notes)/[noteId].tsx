import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ImagePlus, Trash2, Type } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import Colors from '@/constants/colors';
import { useBuydo } from '@/hooks/useBuydoStore';
import type { NoteBlock } from '@/types';
import { clamp, ensureNoteBlocks } from '@/utils/notes';

export default function NoteEditorScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const router = useRouter();
  const { notes, updateNote, deleteNote } = useBuydo();

  const note = useMemo(() => {
    const found = notes.find(n => n.id === noteId);
    return found ? ensureNoteBlocks(found) : undefined;
  }, [notes, noteId]);

  const [title, setTitle] = useState(note?.title ?? '');
  const [blocks, setBlocks] = useState<NoteBlock[]>(note?.blocks ?? []);
  const [isAddingImage, setIsAddingImage] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBlocks(note.blocks ?? []);
    }
  }, [note?.id]);

  useEffect(() => {
    if (!noteId || !note) return;
    const timer = setTimeout(() => {
      const current = note ? JSON.stringify(note.blocks ?? []) : '[]';
      const next = JSON.stringify(blocks);
      if (title !== note?.title || next !== current) {
        updateNote(noteId, title, blocks);
        console.log('Note auto-saved:', noteId);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title, blocks, noteId, note]);

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

  const updateTextBlock = useCallback((blockId: string, text: string) => {
    setBlocks(prev => prev.map(b => (b.id === blockId && b.type === 'text') ? { ...b, text } : b));
  }, []);

  const updateImageWidth = useCallback((blockId: string, widthPct: number) => {
    setBlocks(prev => prev.map(b => (b.id === blockId && b.type === 'image') ? { ...b, widthPct } : b));
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }, []);

  const addTextBlock = useCallback(() => {
    if (!noteId) return;
    const id = `${noteId}-text-${Date.now().toString(36)}`;
    setBlocks(prev => [...prev, { id, type: 'text', text: '' }]);
  }, [noteId]);

  const addImageBlock = useCallback(async () => {
    if (!noteId || isAddingImage) return;

    try {
      setIsAddingImage(true);
      Haptics.selectionAsync();

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to add images to your note.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      let uri = asset.uri;
      if (Platform.OS !== 'web') {
        const noteDir = new Directory(Paths.document, 'notes', noteId);
        if (!noteDir.exists) {
          noteDir.create();
        }

        const ext = (asset.fileName?.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '');
        const filename = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}.${ext || 'jpg'}`;
        const sourceFile = new File(uri);
        const targetFile = new File(noteDir, filename);
        sourceFile.copy(targetFile);
        uri = targetFile.uri;
      }

      const aspectRatio = asset.width && asset.height ? asset.width / asset.height : undefined;
      const id = `${noteId}-img-${Date.now().toString(36)}`;
      setBlocks(prev => [...prev, { id, type: 'image', uri, aspectRatio, widthPct: 1 }]);
    } catch (e) {
      console.log('Failed adding image:', e);
      Alert.alert('Could not add image', 'Please try again.');
    } finally {
      setIsAddingImage(false);
    }
  }, [noteId, isAddingImage]);

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {blocks.map(block => {
          if (block.type === 'text') {
            return (
              <View key={block.id} style={styles.block}>
                <TextInput
                  style={styles.textBlock}
                  value={block.text}
                  onChangeText={(t) => updateTextBlock(block.id, t)}
                  placeholder="Start writing..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                />
                {blocks.length > 1 && (
                  <TouchableOpacity style={styles.blockDelete} onPress={() => removeBlock(block.id)} hitSlop={10}>
                    <Trash2 size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          return (
            <View key={block.id} style={styles.block}>
              <View style={styles.imageWrap}>
                <ExpoImage
                  source={{ uri: block.uri }}
                  style={[
                    styles.image,
                    {
                      width: `${clamp(block.widthPct, 0.25, 1) * 100}%`,
                      aspectRatio: block.aspectRatio ?? 1,
                    },
                  ]}
                  contentFit="contain"
                  transition={150}
                />
              </View>

              <View style={styles.imageControls}>
                <TouchableOpacity
                  style={styles.ctrlBtn}
                  onPress={() => updateImageWidth(block.id, clamp(block.widthPct - 0.1, 0.25, 1))}
                >
                  <Text style={styles.ctrlText}>-</Text>
                </TouchableOpacity>
                {[0.33, 0.5, 0.75, 1].map(pct => (
                  <TouchableOpacity
                    key={pct}
                    style={[styles.presetBtn, Math.abs(block.widthPct - pct) < 0.02 && styles.presetBtnActive]}
                    onPress={() => updateImageWidth(block.id, pct)}
                  >
                    <Text style={[styles.presetText, Math.abs(block.widthPct - pct) < 0.02 && styles.presetTextActive]}>
                      {Math.round(pct * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.ctrlBtn}
                  onPress={() => updateImageWidth(block.id, clamp(block.widthPct + 0.1, 0.25, 1))}
                >
                  <Text style={styles.ctrlText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageDelete} onPress={() => removeBlock(block.id)} hitSlop={10}>
                  <Trash2 size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={styles.autosave}>Auto-saves as you type</Text>
      </ScrollView>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={addTextBlock}>
          <Type size={18} color={Colors.text} />
          <Text style={styles.toolbarText}>Text</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolbarBtn} onPress={addImageBlock} disabled={isAddingImage}>
          {isAddingImage ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <ImagePlus size={18} color={Colors.text} />
          )}
          <Text style={styles.toolbarText}>Image</Text>
        </TouchableOpacity>
      </View>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  block: {
    marginBottom: 14,
  },
  textBlock: {
    minHeight: 90,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  blockDelete: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
  },
  imageWrap: {
    alignItems: 'center',
  },
  image: {
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  imageControls: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  ctrlBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlText: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  presetBtn: {
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  presetTextActive: {
    color: Colors.surface,
  },
  imageDelete: {
    marginLeft: 'auto',
    padding: 6,
  },
  autosave: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center' as const,
    paddingVertical: 12,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  toolbarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
  },
  toolbarText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
});
