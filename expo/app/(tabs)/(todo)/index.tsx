import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, Platform, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Priority } from '@/types';
import { useBuydo } from '@/hooks/useBuydoStore';
import TodoRow from '@/components/TodoRow';
import EmptyState from '@/components/EmptyState';
import FAB from '@/components/FAB';
import FormModal from '@/components/FormModal';
import FormInput from '@/components/FormInput';
import { ensureTodoReminderPermission, parseReminderTimeHHMM, todoRemindersSupported } from '@/utils/todoReminders';

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: Colors.priorityHigh },
  { value: 'medium', label: 'Medium', color: Colors.priorityMedium },
  { value: 'low', label: 'Low', color: Colors.priorityLow },
];

export default function TodoScreen() {
  const { todos, addTodo, updateTodo, toggleTodoCompleted, deleteTodo } = useBuydo();

  const sortedTodos = useMemo(() => {
    const active = todos.filter(t => !t.isCompleted);
    const completed = todos.filter(t => t.isCompleted);
    const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    active.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return [...active, ...completed];
  }, [todos]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueDateObj, setDueDateObj] = useState<Date | null>(null);
  const [remind, setRemind] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderTimeObj, setReminderTimeObj] = useState<Date>(new Date(2000, 0, 1, 9, 0));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setDueDateObj(null);
    setRemind(false);
    setReminderTime('09:00');
    setReminderTimeObj(new Date(2000, 0, 1, 9, 0));
    setEditingTodo(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    setEditingTodo(todoId);
    setTitle(todo.title);
    setDescription(todo.description ?? '');
    setPriority(todo.priority);
    const existingDate = todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '';
    setDueDate(existingDate);
    setDueDateObj(existingDate ? new Date(existingDate + 'T12:00:00') : null);
    setRemind(!!todo.remind);
    const timeStr = todo.reminderTime?.trim() || '09:00';
    setReminderTime(timeStr);
    const [h, m] = timeStr.split(':').map(Number);
    setReminderTimeObj(new Date(2000, 0, 1, h || 9, m || 0));
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const parsedDate = dueDate.trim() ? new Date(dueDate.trim()).toISOString() : undefined;
    if (remind && !parsedDate) {
      Alert.alert('Add a due date', 'Reminders need a due date (YYYY-MM-DD).');
      return;
    }
    if (remind) {
      const parsedTime = parseReminderTimeHHMM(reminderTime);
      if (!parsedTime) {
        Alert.alert('Invalid time', 'Reminder time must be in 24h format like 09:00 or 18:30.');
        return;
      }
    }
    if (editingTodo) {
      updateTodo(editingTodo, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: parsedDate,
        remind,
        reminderTime: reminderTime.trim() || '09:00',
      });
    } else {
      addTodo(title.trim(), priority, description.trim() || undefined, parsedDate, remind, reminderTime.trim() || '09:00');
    }
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (todoId: string, name: string) => {
    Alert.alert('Delete Task', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deleteTodo(todoId);
        },
      },
    ]);
  };

  const activeCount = todos.filter(t => !t.isCompleted).length;
  const completedCount = todos.filter(t => t.isCompleted).length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {todos.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statNum}>{activeCount}</Text>
              <Text style={styles.statLabel}>active</Text>
            </View>
            <View style={[styles.statPill, styles.statPillDone]}>
              <Text style={[styles.statNum, styles.statNumDone]}>{completedCount}</Text>
              <Text style={[styles.statLabel, styles.statLabelDone]}>done</Text>
            </View>
          </View>
        )}

        {sortedTodos.length === 0 ? (
          <EmptyState
            icon="✅"
            title="All clear!"
            subtitle="Tap + to add a new task"
          />
        ) : (
          sortedTodos.map(task => (
            <TodoRow
              key={task.id}
              task={task}
              onToggle={() => toggleTodoCompleted(task.id)}
              onDelete={() => handleDelete(task.id, task.title)}
              onPress={() => openEdit(task.id)}
            />
          ))
        )}
      </ScrollView>

      <FAB onPress={openAdd} testID="add-todo-fab" />

      <FormModal
        visible={modalVisible}
        title={editingTodo ? 'Edit Task' : 'New Task'}
        onClose={() => { setModalVisible(false); resetForm(); }}
        onSubmit={handleSubmit}
        submitDisabled={!title.trim()}
      >
        <FormInput
          label="Title"
          required
          placeholder="What needs to be done?"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />
        <FormInput
          label="Description"
          placeholder="Optional details..."
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Text style={styles.pickerLabel}>PRIORITY</Text>
        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.priorityBtn,
                priority === opt.value && { backgroundColor: opt.color + '18', borderColor: opt.color },
              ]}
              onPress={() => setPriority(opt.value)}
            >
              <View style={[styles.priorityDot, { backgroundColor: opt.color }]} />
              <Text style={[
                styles.priorityText,
                priority === opt.value && { color: opt.color, fontWeight: '600' as const },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {Platform.OS === 'web' ? (
          <FormInput
            label="Due Date"
            placeholder="YYYY-MM-DD"
            value={dueDate}
            onChangeText={(v) => {
              setDueDate(v);
              if (!v.trim()) setRemind(false);
            }}
          />
        ) : (
          <>
            <Text style={styles.pickerLabel}>DUE DATE</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                setShowDatePicker(true);
                setShowTimePicker(false);
              }}
              activeOpacity={0.7}
            >
              <Calendar size={18} color={dueDateObj ? Colors.primary : Colors.textTertiary} />
              <Text style={[
                styles.datePickerButtonText,
                dueDateObj && styles.datePickerButtonTextActive,
              ]}>
                {dueDateObj
                  ? dueDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Select a date'}
              </Text>
              {dueDateObj && (
                <TouchableOpacity
                  onPress={() => {
                    setDueDate('');
                    setDueDateObj(null);
                    setRemind(false);
                    setShowDatePicker(false);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dueDateObj || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (selected) {
                    setDueDateObj(selected);
                    setDueDate(selected.toISOString().split('T')[0]);
                  }
                }}
                accentColor={Colors.primary}
              />
            )}
          </>
        )}

        {Platform.OS !== 'web' && (
          <View style={styles.remindRow}>
            <View style={styles.remindTextCol}>
              <Text style={styles.remindLabel}>REMIND ME</Text>
              <Text style={styles.remindSubtext}>At {reminderTime || '09:00'} on the due date</Text>
            </View>
            <Switch
              value={remind}
              onValueChange={(next) => {
                if (!next) {
                  setRemind(false);
                  return;
                }
                if (!dueDate.trim()) {
                  Alert.alert('Set a due date first', 'Add a due date to enable reminders.');
                  return;
                }
                if (!todoRemindersSupported()) {
                  Alert.alert('Not supported', 'Reminders are not supported on this platform.');
                  return;
                }
                void (async () => {
                  const ok = await ensureTodoReminderPermission();
                  if (!ok) {
                    Alert.alert('Notifications disabled', 'Enable notification permission to get reminders.');
                    setRemind(false);
                    return;
                  }
                  setRemind(true);
                })();
              }}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>
        )}

        {Platform.OS !== 'web' && remind && (
          <>
            <Text style={styles.pickerLabel}>REMINDER TIME</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                setShowTimePicker(true);
                setShowDatePicker(false);
              }}
              activeOpacity={0.7}
            >
              <Clock size={18} color={Colors.primary} />
              <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextActive]}>
                {reminderTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={reminderTimeObj}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour={false}
                onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                  if (Platform.OS === 'android') setShowTimePicker(false);
                  if (selected) {
                    setReminderTimeObj(selected);
                    const hh = String(selected.getHours()).padStart(2, '0');
                    const mm = String(selected.getMinutes()).padStart(2, '0');
                    setReminderTime(`${hh}:${mm}`);
                  }
                }}
                accentColor={Colors.primary}
              />
            )}
          </>
        )}
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statPillDone: {
    backgroundColor: Colors.surfaceAlt,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statNumDone: {
    color: Colors.textSecondary,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  statLabelDone: {
    color: Colors.textSecondary,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  remindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  remindTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  remindLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  remindSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textTertiary,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  datePickerButtonText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textTertiary,
  },
  datePickerButtonTextActive: {
    color: Colors.text,
    fontWeight: '500' as const,
  },
  clearBtnText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600' as const,
  },
});
