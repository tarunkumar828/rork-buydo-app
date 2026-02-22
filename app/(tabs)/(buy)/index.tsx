import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors, { storeColors, storeIcons } from '@/constants/colors';
import { useSmartList } from '@/hooks/useSmartListStore';
import StoreCard from '@/components/StoreCard';
import EmptyState from '@/components/EmptyState';
import FAB from '@/components/FAB';
import FormModal from '@/components/FormModal';
import FormInput from '@/components/FormInput';

export default function BuyScreen() {
  const router = useRouter();
  const { stores, getStoreItemCount, addStore, updateStore, deleteStore } = useSmartList();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(storeIcons[0]);
  const [selectedColor, setSelectedColor] = useState(storeColors[0]);

  const resetForm = () => {
    setStoreName('');
    setSelectedIcon(storeIcons[0]);
    setSelectedColor(storeColors[0]);
    setEditingStore(null);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    setEditingStore(storeId);
    setStoreName(store.name);
    setSelectedIcon(store.icon);
    setSelectedColor(store.color);
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!storeName.trim()) return;
    if (editingStore) {
      updateStore(editingStore, storeName.trim(), selectedIcon, selectedColor);
    } else {
      addStore(storeName.trim(), selectedIcon, selectedColor);
    }
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (storeId: string, name: string) => {
    Alert.alert('Delete Store', `Delete "${name}" and all its items?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deleteStore(storeId);
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
        <Text style={styles.sectionTitle}>My Stores</Text>
        {stores.length === 0 ? (
          <EmptyState
            icon="🏪"
            title="No stores yet"
            subtitle="Add a store to start your shopping lists"
          />
        ) : (
          stores.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              itemCount={getStoreItemCount(store.id)}
              onPress={() => router.push(`/${store.id}` as never)}
              onLongPress={() => openEdit(store.id)}
              onDelete={() => handleDelete(store.id, store.name)}
            />
          ))
        )}
      </ScrollView>

      <FAB onPress={openAdd} testID="add-store-fab" />

      <FormModal
        visible={modalVisible}
        title={editingStore ? 'Edit Store' : 'New Store'}
        onClose={() => { setModalVisible(false); resetForm(); }}
        onSubmit={handleSubmit}
        submitDisabled={!storeName.trim()}
      >
        <FormInput
          label="Store Name"
          required
          placeholder="e.g. Costco, Target..."
          value={storeName}
          onChangeText={setStoreName}
          autoFocus
        />
        <Text style={styles.pickerLabel}>ICON</Text>
        <View style={styles.pickerRow}>
          {storeIcons.map(icon => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.pickerLabel}>COLOR</Text>
        <View style={styles.pickerRow}>
          {storeColors.map(color => (
            <TouchableOpacity
              key={color}
              style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorOptionSelected]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
      </FormModal>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  iconText: {
    fontSize: 22,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.text,
  },
});
