import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import { Directory, Paths } from 'expo-file-system';
import { Store, ShoppingItem, TodoTask, Note, NoteBlock, Priority } from '@/types';
import { seedStores, seedItems, seedTodos, seedNotes } from '@/mocks/seeds';
import { ensureNoteBlocks, notePlainText } from '@/utils/notes';

const STORAGE_KEYS = {
  stores: 'buydo_stores',
  items: 'buydo_items',
  todos: 'buydo_todos',
  notes: 'buydo_notes',
  seeded: 'buydo_seeded',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

async function loadData<T>(key: string, fallback: T[]): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return fallback;
  } catch (e) {
    console.log('Error loading data for key:', key, e);
    return fallback;
  }
}

async function saveData<T>(key: string, data: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.log('Error saving data for key:', key, e);
  }
}

async function initSeedIfNeeded(): Promise<boolean> {
  const seeded = await AsyncStorage.getItem(STORAGE_KEYS.seeded);
  if (!seeded) {
    await Promise.all([
      saveData(STORAGE_KEYS.stores, seedStores),
      saveData(STORAGE_KEYS.items, seedItems),
      saveData(STORAGE_KEYS.todos, seedTodos),
      saveData(STORAGE_KEYS.notes, seedNotes),
      AsyncStorage.setItem(STORAGE_KEYS.seeded, 'true'),
    ]);
    return true;
  }
  return false;
}

export const [BuydoProvider, useBuydo] = createContextHook(() => {
  const queryClient = useQueryClient();

  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [todos, setTodos] = useState<TodoTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      await initSeedIfNeeded();
      return loadData<Store>(STORAGE_KEYS.stores, seedStores);
    },
  });

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: () => loadData<ShoppingItem>(STORAGE_KEYS.items, seedItems),
    enabled: storesQuery.isSuccess,
  });

  const todosQuery = useQuery({
    queryKey: ['todos'],
    queryFn: () => loadData<TodoTask>(STORAGE_KEYS.todos, seedTodos),
    enabled: storesQuery.isSuccess,
  });

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const loaded = await loadData<Note>(STORAGE_KEYS.notes, seedNotes);
      return loaded.map(ensureNoteBlocks);
    },
    enabled: storesQuery.isSuccess,
  });

  useEffect(() => {
    if (storesQuery.data) setStores(storesQuery.data);
  }, [storesQuery.data]);

  useEffect(() => {
    if (itemsQuery.data) setItems(itemsQuery.data);
  }, [itemsQuery.data]);

  useEffect(() => {
    if (todosQuery.data) setTodos(todosQuery.data);
  }, [todosQuery.data]);

  useEffect(() => {
    if (notesQuery.data) setNotes(notesQuery.data);
  }, [notesQuery.data]);

  const syncStores = useMutation({
    mutationFn: (data: Store[]) => saveData(STORAGE_KEYS.stores, data),
  });

  const syncItems = useMutation({
    mutationFn: (data: ShoppingItem[]) => saveData(STORAGE_KEYS.items, data),
  });

  const syncTodos = useMutation({
    mutationFn: (data: TodoTask[]) => saveData(STORAGE_KEYS.todos, data),
  });

  const syncNotes = useMutation({
    mutationFn: (data: Note[]) => saveData(STORAGE_KEYS.notes, data),
  });

  const addStore = useCallback((name: string, icon: string, color: string) => {
    const newStore: Store = { id: generateId(), name, icon, color, createdAt: new Date().toISOString() };
    setStores(prev => {
      const updated = [...prev, newStore];
      syncStores.mutate(updated);
      return updated;
    });
    return newStore;
  }, []);

  const updateStore = useCallback((id: string, name: string, icon: string, color: string) => {
    setStores(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, name, icon, color } : s);
      syncStores.mutate(updated);
      return updated;
    });
  }, []);

  const deleteStore = useCallback((id: string) => {
    setStores(prev => {
      const updated = prev.filter(s => s.id !== id);
      syncStores.mutate(updated);
      return updated;
    });
    setItems(prev => {
      const updated = prev.filter(i => i.storeId !== id);
      syncItems.mutate(updated);
      return updated;
    });
  }, []);

  const addItem = useCallback((storeId: string, name: string, quantity?: string, itemNotes?: string) => {
    const newItem: ShoppingItem = {
      id: generateId(), storeId, name, quantity, notes: itemNotes,
      isPurchased: false, createdAt: new Date().toISOString(),
    };
    setItems(prev => {
      const updated = [...prev, newItem];
      syncItems.mutate(updated);
      return updated;
    });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<ShoppingItem>) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...updates } : i);
      syncItems.mutate(updated);
      return updated;
    });
  }, []);

  const toggleItemPurchased = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, isPurchased: !i.isPurchased } : i);
      syncItems.mutate(updated);
      return updated;
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      syncItems.mutate(updated);
      return updated;
    });
  }, []);

  const addTodo = useCallback((title: string, priority: Priority, description?: string, dueDate?: string) => {
    const newTodo: TodoTask = {
      id: generateId(), title, description, priority, dueDate,
      isCompleted: false, createdAt: new Date().toISOString(),
    };
    setTodos(prev => {
      const updated = [...prev, newTodo];
      syncTodos.mutate(updated);
      return updated;
    });
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<TodoTask>) => {
    setTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      syncTodos.mutate(updated);
      return updated;
    });
  }, []);

  const toggleTodoCompleted = useCallback((id: string) => {
    setTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
      syncTodos.mutate(updated);
      return updated;
    });
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => {
      const updated = prev.filter(t => t.id !== id);
      syncTodos.mutate(updated);
      return updated;
    });
  }, []);

  const addNote = useCallback((title: string, blocks?: NoteBlock[]) => {
    const now = new Date().toISOString();
    const id = generateId();
    const ensuredBlocks: NoteBlock[] = blocks && blocks.length > 0 ? blocks : [{ id: `${id}-text-0`, type: 'text' as const, text: '' }];
    const newNote: Note = {
      id,
      title,
      blocks: ensuredBlocks,
      content: notePlainText({ id, title, blocks: ensuredBlocks, createdAt: now, updatedAt: now }),
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => {
      const updated = [...prev, newNote];
      syncNotes.mutate(updated);
      return updated;
    });
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, title: string, blocks: NoteBlock[]) => {
    setNotes(prev => {
      const updatedAt = new Date().toISOString();
      const nextContent = notePlainText({ id, title, blocks, createdAt: updatedAt, updatedAt });
      const updated = prev.map(n => n.id === id ? { ...n, title, blocks, content: nextContent, updatedAt } : n);
      syncNotes.mutate(updated);
      return updated;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      syncNotes.mutate(updated);
      return updated;
    });

    if (Platform.OS !== 'web') {
      try {
        const dir = new Directory(Paths.document, 'notes', id);
        if (dir.exists) {
          dir.delete();
        }
      } catch (e) {
        console.log('Failed to delete note directory:', e);
      }
    }
  }, []);

  const getStoreItems = useCallback((storeId: string) => {
    return items.filter(i => i.storeId === storeId);
  }, [items]);

  const getStoreItemCount = useCallback((storeId: string) => {
    return items.filter(i => i.storeId === storeId && !i.isPurchased).length;
  }, [items]);

  const isLoading = storesQuery.isLoading || itemsQuery.isLoading || todosQuery.isLoading || notesQuery.isLoading;

  return {
    stores, items, todos, notes, isLoading,
    addStore, updateStore, deleteStore,
    addItem, updateItem, toggleItemPurchased, deleteItem,
    getStoreItems, getStoreItemCount,
    addTodo, updateTodo, toggleTodoCompleted, deleteTodo,
    addNote, updateNote, deleteNote,
  };
});
