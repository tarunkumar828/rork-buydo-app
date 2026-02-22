import { Store, ShoppingItem, TodoTask, Note } from '@/types';

export const seedStores: Store[] = [
  { id: 's1', name: 'Costco', icon: '🛒', color: '#1D4ED8', createdAt: new Date().toISOString() },
  { id: 's2', name: 'Walmart', icon: '🏪', color: '#EA580C', createdAt: new Date().toISOString() },
  { id: 's3', name: 'Albertsons', icon: '🍎', color: '#059669', createdAt: new Date().toISOString() },
];

export const seedItems: ShoppingItem[] = [
  { id: 'i1', storeId: 's1', name: 'Chicken Breast', quantity: '2 packs', isPurchased: false, createdAt: new Date().toISOString() },
  { id: 'i2', storeId: 's1', name: 'Paper Towels', quantity: '1', isPurchased: false, createdAt: new Date().toISOString() },
  { id: 'i3', storeId: 's1', name: 'Olive Oil', isPurchased: true, createdAt: new Date().toISOString() },
  { id: 'i4', storeId: 's2', name: 'Toothpaste', quantity: '2', isPurchased: false, createdAt: new Date().toISOString() },
  { id: 'i5', storeId: 's2', name: 'Laundry Detergent', isPurchased: false, createdAt: new Date().toISOString() },
  { id: 'i6', storeId: 's3', name: 'Bread', quantity: '1 loaf', isPurchased: false, createdAt: new Date().toISOString() },
];

export const seedTodos: TodoTask[] = [
  { id: 't1', title: 'Schedule dentist appointment', priority: 'high', isCompleted: false, createdAt: new Date().toISOString() },
  { id: 't2', title: 'Renew car registration', description: 'Due by end of month', priority: 'high', dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), isCompleted: false, createdAt: new Date().toISOString() },
  { id: 't3', title: 'Clean garage', priority: 'medium', isCompleted: false, createdAt: new Date().toISOString() },
  { id: 't4', title: 'Read new book', description: 'Start with chapter 1', priority: 'low', isCompleted: false, createdAt: new Date().toISOString() },
];

export const seedNotes: Note[] = [
  { id: 'n1', title: 'WiFi Password', content: 'Home network: MyWiFi_5G\nPassword: securepass123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'n2', title: 'Recipe: Pasta Carbonara', content: '- 400g spaghetti\n- 200g pancetta\n- 4 egg yolks\n- 100g parmesan\n- Black pepper\n\n1. Cook pasta al dente\n2. Fry pancetta until crispy\n3. Mix eggs with parmesan\n4. Combine everything off heat', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
