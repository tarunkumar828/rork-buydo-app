export interface Store {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  storeId: string;
  name: string;
  quantity?: string;
  notes?: string;
  isPurchased: boolean;
  createdAt: string;
}

export type Priority = 'high' | 'medium' | 'low';

export interface TodoTask {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
