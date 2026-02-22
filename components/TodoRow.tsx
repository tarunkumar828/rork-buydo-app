import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Check, Trash2, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { TodoTask } from '@/types';
import PriorityBadge from './PriorityBadge';

interface TodoRowProps {
  task: TodoTask;
  onToggle: () => void;
  onDelete: () => void;
  onPress?: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return 'Overdue';
  if (days <= 7) return `${days}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TodoRow({ task, onToggle, onDelete, onPress }: TodoRowProps) {
  const fadeAnim = useRef(new Animated.Value(task.isCompleted ? 0.5 : 1)).current;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = task.isCompleted ? 1 : 0.5;
    Animated.timing(fadeAnim, { toValue, duration: 200, useNativeDriver: true }).start();
    onToggle();
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.isCompleted;

  return (
    <Animated.View style={[styles.row, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[
          styles.checkbox,
          task.isCompleted && styles.checkboxChecked,
        ]}
        onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {task.isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </TouchableOpacity>

      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.topRow}>
          <Text style={[styles.title, task.isCompleted && styles.titleChecked]} numberOfLines={1}>
            {task.title}
          </Text>
          <PriorityBadge priority={task.priority} />
        </View>
        {(task.description || task.dueDate) && (
          <View style={styles.bottomRow}>
            {task.description ? (
              <Text style={styles.description} numberOfLines={1}>{task.description}</Text>
            ) : null}
            {task.dueDate ? (
              <View style={styles.dueDateRow}>
                <Calendar size={11} color={isOverdue ? Colors.danger : Colors.textSecondary} />
                <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
                  {formatDate(task.dueDate)}
                </Text>
              </View>
            ) : null}
          </View>
        )}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  titleChecked: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textTertiary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  overdue: {
    color: Colors.danger,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
