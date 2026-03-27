import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { ChevronRight, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Store } from '@/types';

interface StoreCardProps {
  store: Store;
  itemCount: number;
  onPress: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
}

export default function StoreCard({ store, itemCount, onPress, onLongPress, onDelete }: StoreCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress?.();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`store-card-${store.id}`}
      >
        <View style={[styles.iconBg, { backgroundColor: store.color + '15' }]}>
          <Text style={styles.icon}>{store.icon}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
          <Text style={styles.count}>
            {itemCount === 0 ? 'No items' : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={styles.rightSection}>
          {onDelete && (
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
          )}
          <ChevronRight size={18} color={Colors.textTertiary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  count: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 6,
  },
});
