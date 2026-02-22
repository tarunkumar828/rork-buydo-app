import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ShoppingItem } from '@/types';

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
  onPress?: () => void;
}

export default function ItemRow({ item, onToggle, onDelete, onPress }: ItemRowProps) {
  const fadeAnim = useRef(new Animated.Value(item.isPurchased ? 0.5 : 1)).current;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = item.isPurchased ? 1 : 0.5;
    Animated.timing(fadeAnim, { toValue, duration: 200, useNativeDriver: true }).start();
    onToggle();
  };

  return (
    <Animated.View style={[styles.row, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[styles.checkbox, item.isPurchased && styles.checkboxChecked]}
        onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {item.isPurchased && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </TouchableOpacity>

      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.6}>
        <Text style={[styles.name, item.isPurchased && styles.nameChecked]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.meta}>
          {item.quantity ? (
            <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          ) : null}
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={1}>{item.notes}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDelete();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={16} color={Colors.danger} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  nameChecked: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textTertiary,
  },
  meta: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 8,
  },
  quantity: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '500' as const,
  },
  notes: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  deleteBtn: {
    padding: 6,
  },
});
