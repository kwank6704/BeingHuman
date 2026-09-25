'use client';

import { createContext, useContext } from 'react';
import type { useBookState } from './useBookState';

export type Book = ReturnType<typeof useBookState>;

export const BookContext = createContext<Book | null>(null);

export function useBook(): Book {
  const b = useContext(BookContext);
  if (!b) throw new Error('useBook() used outside <BookContext>');
  return b;
}
