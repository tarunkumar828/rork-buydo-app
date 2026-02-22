import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBuydo } from '@/hooks/useBuydoStore';
import ItemRow from '@/components/ItemRow';
import EmptyState from '@/components/EmptyState';
import FAB from '@/components/FAB';
import FormModal from '@/components/FormModal';
import FormInput from '@/components/FormInput';

export default function StoreDetailScreen() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { stores, getStoreItems, addItem, updateItem, toggleItemPurchased, deleteItem } = useBuydo();

  const store = stores.find(s => s.id === storeId);
  const allItems = getStoreItems(storeId ?? '');

  const sortedItems = useMemo(() => {
    const unpurchased = allItems.filter(i => !i.isPurchased);
    const purchased = allItems.filter(i => i.isPurchased);
    return [...unpurchased, ...purchased];
  }, [allItems]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  const resetForm = () => {
    setItemName('');
    setItemQuantity('');
    setItemNotes('');
    setEditingItem(null);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (itemId: string) => {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    setEditingItem(itemId);
    setItemName(item.name);
    setItemQuantity(item.quantity ?? '');
    setItemNotes(item.notes ?? '');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!itemName.trim() || !storeId) return;
    if (editingItem) {
      updateItem(editingItem, {
        name: itemName.trim(),
        quantity: itemQuantity.trim() || undefined,
        notes: itemNotes.trim() || undefined,
      });
    } else {
      addItem(storeId, itemName.trim(), itemQuantity.trim() || undefined, itemNotes.trim() || undefined);
    }
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (itemId: string, name: string) => {
    Alert.alert('Delete Item', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deleteItem(itemId);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: store?.name ?? 'Store' }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedItems.length === 0 ? (
          <EmptyState
            icon="📝"
            title="Empty list"
            subtitle="Tap + to add items to your shopping list"
          />
        ) : (
          sortedItems.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={() => toggleItemPurchased(item.id)}
              onDelete={() => handleDelete(item.id, item.name)}
              onPress={() => openEdit(item.id)}
            />
          ))
        )}
      </ScrollView>

      <FAB onPress={openAdd} testID="add-item-fab" />

      <FormModal
        visible={modalVisible}
        title={editingItem ? 'Edit Item' : 'Add Item'}
        onClose={() => { setModalVisible(false); resetForm(); }}
        onSubmit={handleSubmit}
        submitDisabled={!itemName.trim()}
      >
        <FormInput
          label="Item Name"
          required
          placeholder="e.g. Milk, Eggs..."
          value={itemName}
          onChangeText={setItemName}
          autoFocus
        />
        <FormInput
          label="Quantity"
          placeholder="e.g. 2 lbs, 1 pack"
          value={itemQuantity}
          onChangeText={setItemQuantity}
        />
        <FormInput
          label="Notes"
          placeholder="Optional notes..."
          value={itemNotes}
          onChangeText={setItemNotes}
          multiline
        />
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
});
