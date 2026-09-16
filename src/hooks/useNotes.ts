import { useState, useMemo, useCallback } from 'react';
import { NoteItem } from '../types';
import {
  createNote,
  updateNote,
  deleteNote,
} from '../services/db';
import { formatErrorMessage } from '../lib/errors';

export function useNotes(initialNotes: NoteItem[] = []) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateNotesList = useCallback((newNotes: NoteItem[]) => {
    setNotes(newNotes);
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch =
        !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.body?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || n.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [notes, searchQuery, selectedCategory]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const saveNote = useCallback(
    async (noteData: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const res = await createNote(noteData);
        return res.id;
      } catch (err) {
        setError(formatErrorMessage(err));
        throw err;
      }
    },
    []
  );

  const modifyNote = useCallback(
    async (id: string, updates: Partial<NoteItem>) => {
      try {
        await updateNote(id, updates);
      } catch (err) {
        setError(formatErrorMessage(err));
        throw err;
      }
    },
    []
  );

  const removeNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
      if (activeNoteId === id) setActiveNoteId(null);
    } catch (err) {
      setError(formatErrorMessage(err));
      throw err;
    }
  }, [activeNoteId]);

  return {
    notes: filteredNotes,
    allNotes: notes,
    setNotes: updateNotesList,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    saveNote,
    modifyNote,
    removeNote,
    error,
    clearError: () => setError(null),
  };
}
