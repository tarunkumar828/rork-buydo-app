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
  /**
   * Legacy plain-text content (kept for backward compatibility + quick previews).
   * New notes should primarily use `blocks`.
   */
  content?: string;
  /**
   * Block-based note content (text + images). If missing, treat as a single text block from `content`.
   */
  blocks?: NoteBlock[];
  createdAt: string;
  updatedAt: string;
}

export type NoteBlock = NoteTextBlock | NoteImageBlock;

export interface NoteTextBlock {
  id: string;
  type: 'text';
  text: string;
}

export interface NoteImageBlock {
  id: string;
  type: 'image';
  uri: string;
  /**
   * Image aspect ratio (width / height), used to render consistently.
   */
  aspectRatio?: number;
  /**
   * Width as a percentage of the note content container.
   * Example: 1 = 100%, 0.5 = 50%.
   */
  widthPct: number;
}
