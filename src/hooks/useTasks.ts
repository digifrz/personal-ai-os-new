import { useState, useMemo, useCallback } from 'react';
import { TaskItem } from '../types';
import {
  createTask,
  updateTask,
  deleteTask,
  batchUpdateTaskOrders,
} from '../services/db';
import { formatErrorMessage } from '../lib/errors';

export function useTasks(initialTasks: TaskItem[] = []) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Sync external tasks changes
  const updateTaskList = useCallback((newTasks: TaskItem[]) => {
    setTasks(newTasks);
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || task.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [tasks, searchQuery, selectedCategory, selectedPriority]);

  const toggleTaskStatus = useCallback(
    async (task: TaskItem) => {
      const nextStatus: TaskItem['status'] = task.status === 'done' ? 'open' : 'done';
      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));

      try {
        await updateTask(task.id, { status: nextStatus });
      } catch (err) {
        // Rollback
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
        setError(formatErrorMessage(err));
      }
    },
    []
  );

  const removeTask = useCallback(async (taskId: string) => {
    const backup = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await deleteTask(taskId);
    } catch (err) {
      setTasks(backup);
      setError(formatErrorMessage(err));
    }
  }, [tasks]);

  const reorderTasks = useCallback(async (reordered: TaskItem[]) => {
    setTasks(reordered);
    const updates = reordered.map((item, index) => ({ id: item.id, order: index }));
    try {
      await batchUpdateTaskOrders(updates);
    } catch (err) {
      console.warn('Batch task order update notice:', err);
    }
  }, []);

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    setTasks: updateTaskList,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedPriority,
    setSelectedPriority,
    toggleTaskStatus,
    removeTask,
    reorderTasks,
    error,
    clearError: () => setError(null),
    isMutating,
  };
}
