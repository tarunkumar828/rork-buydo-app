import type { Note, NoteBlock, NoteTextBlock, NoteImageBlock } from '@/types';

export function ensureNoteBlocks(note: Note): Note {
  if (Array.isArray(note.blocks) && note.blocks.length > 0) return note;

  const legacyText = typeof note.content === 'string' ? note.content : '';
  const blocks: NoteBlock[] = [
    {
      id: `${note.id}-text-0`,
      type: 'text',
      text: legacyText,
    } satisfies NoteTextBlock,
  ];

  return {
    ...note,
    content: legacyText,
    blocks,
  };
}

export function notePlainText(note: Note): string {
  if (Array.isArray(note.blocks)) {
    return note.blocks
      .filter((b): b is NoteTextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();
  }

  return (note.content ?? '').trim();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function createTextBlock(noteId: string, blockId: string, text = ''): NoteTextBlock {
  return { id: `${noteId}-${blockId}`, type: 'text', text };
}

export function createImageBlock(params: {
  noteId: string;
  blockId: string;
  uri: string;
  aspectRatio?: number;
  widthPct?: number;
}): NoteImageBlock {
  return {
    id: `${params.noteId}-${params.blockId}`,
    type: 'image',
    uri: params.uri,
    aspectRatio: params.aspectRatio,
    widthPct: params.widthPct ?? 1,
  };
}

