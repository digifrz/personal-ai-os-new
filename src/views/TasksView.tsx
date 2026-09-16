import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Sparkles,
  Trash2,
  Edit2,
  Copy,
  Tag,
  Clock,
  ChevronRight,
  X,
  AlertCircle,
  GripVertical,
  ArrowUpDown,
  Move,
  Check,
} from 'lucide-react';
import { Reorder, useDragControls, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { TaskItem } from '../types';
import { createTask, updateTask, deleteTask, batchUpdateTaskOrders } from '../services/db';
import { askAI } from '../services/ai';
import { EmptyState } from '../components/common/EmptyState';

interface TasksViewProps {
  tasks: TaskItem[];
  isEditorOpen: boolean;
  onCloseEditor: () => void;
  onOpenEditor: () => void;
  onReorderTasks?: (reorderedTasks: TaskItem[]) => void;
}

// Helpers for persisting and restoring visual order
function getStoredTaskOrder(userId?: string): string[] {
  try {
    const key = `paio_task_order_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredTaskOrder(userId: string | undefined, taskIds: string[]) {
  try {
    const key = `paio_task_order_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(taskIds));
  } catch (e) {
    // Ignore storage quota errors
  }
}

function sortTasksByCustomOrder(taskList: TaskItem[], userId?: string): TaskItem[] {
  const storedIds = getStoredTaskOrder(userId);
  const idToOrder = new Map<string, number>();

  // If user has stored an order array, use it
  if (storedIds.length > 0) {
    storedIds.forEach((id, index) => idToOrder.set(id, index));
  }

  return [...taskList].sort((a, b) => {
    // Check explicit order property on tasks
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // Check stored localStorage order index
    const orderA = idToOrder.has(a.id) ? idToOrder.get(a.id)! : (a.order ?? 999999);
    const orderB = idToOrder.has(b.id) ? idToOrder.get(b.id)! : (b.order ?? 999999);
    if (orderA !== orderB) return orderA - orderB;
    // Fallback to latest
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

// Draggable List Item component utilizing Framer Motion's useDragControls
interface TaskListItemProps {
  task: TaskItem;
  index: number;
  isManualSort: boolean;
  onToggleStatus: (task: TaskItem) => void;
  onOpenEdit: (task: TaskItem) => void;
  onDuplicateTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  index,
  isManualSort,
  onToggleStatus,
  onOpenEdit,
  onDuplicateTask,
  onDeleteTask,
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      id={`task-item-${task.id}`}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.015,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
        borderColor: 'var(--color-primary)',
        zIndex: 60,
      }}
      className="group relative flex items-start gap-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-primary)]/70 transition-colors select-none"
    >
      {/* Dedicated Drag & Drop Handle */}
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        className="mt-0.5 flex h-7 w-6 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40 cursor-grab active:cursor-grabbing touch-none transition-colors"
        title="Drag handle to reprioritize task"
        aria-label={`Drag handle to reprioritize task ${task.title}`}
      >
        <GripVertical className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity text-[var(--color-text)]" />
      </button>

      {/* Visual Priority Rank Badge when in manual priority order */}
      {isManualSort && (
        <span
          className="mt-1 flex h-5 min-w-[24px] px-1 items-center justify-center rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/40 transition-colors shrink-0"
          title={`Priority position #${index + 1}`}
        >
          #{index + 1}
        </span>
      )}

      {/* Status Checkbox Button */}
      <button
        type="button"
        onClick={() => onToggleStatus(task)}
        aria-label="Toggle task status"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-all ${
          task.status === 'done'
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
            : 'border-[var(--color-border)] text-transparent hover:border-emerald-500'
        }`}
      >
        ✓
      </button>

      {/* Main Task Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong
            className={`text-sm font-bold text-[var(--color-text)] ${
              task.status === 'done' ? 'line-through opacity-50' : ''
            }`}
          >
            {task.title}
          </strong>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              task.priority === 'high'
                ? 'bg-red-500/15 text-red-400'
                : task.priority === 'medium'
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-muted)]">
          <span className="rounded-md bg-[var(--color-bg-secondary)] px-2 py-0.5 font-medium">
            #{task.category.toLowerCase()}
          </span>
          {task.dueAt && (
            <span className="flex items-center gap-1 text-[var(--color-cyan)]">
              <Clock className="w-3 h-3" />
              <span>Due {task.dueAt}</span>
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onOpenEdit(task)}
          className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5"
          title="Edit task"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDuplicateTask(task)}
          className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5"
          title="Duplicate task"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteTask(task.id)}
          className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-red-400 hover:bg-red-500/10"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
};

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  isEditorOpen,
  onCloseEditor,
  onOpenEditor,
  onReorderTasks,
}) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'manual' | 'priority' | 'due' | 'title'>('manual');
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for prioritized tasks
  const [currentTasks, setCurrentTasks] = useState<TaskItem[]>(() =>
    sortTasksByCustomOrder(tasks, user?.uid)
  );

  // Sync with incoming tasks prop while preserving custom sequence
  useEffect(() => {
    setCurrentTasks((prev) => {
      const incomingMap = new Map<string, TaskItem>(tasks.map((t) => [t.id, t]));
      const seenIds = new Set<string>();
      const merged: TaskItem[] = [];

      // Preserve existing order of known tasks
      for (const item of prev) {
        if (incomingMap.has(item.id)) {
          merged.push(incomingMap.get(item.id)!);
          seenIds.add(item.id);
        }
      }

      // Add any newly arrived tasks to the list
      for (const task of tasks) {
        if (!seenIds.has(task.id)) {
          merged.push(task);
        }
      }

      return merged.length > 0 ? merged : tasks;
    });
  }, [tasks]);

  // Kanban drag-and-drop state
  const [draggedKanbanTaskId, setDraggedKanbanTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<'open' | 'in_progress' | 'done' | null>(null);

  // Task form state
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState('Work');
  const [dueAt, setDueAt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('Work');
    setDueAt(new Date().toISOString().slice(0, 10));
    onOpenEditor();
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setCategory(task.category);
    setDueAt(task.dueAt || '');
    onOpenEditor();
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
          category,
          dueAt: dueAt || null,
        });
        showNotification('Task updated successfully.');
      } else {
        const newTaskOrder = currentTasks.length;
        await createTask({
          userId: user.uid,
          title: title.trim(),
          description: description.trim(),
          status: 'open',
          priority,
          category,
          dueAt: dueAt || null,
          order: newTaskOrder,
        });
        showNotification('Task created successfully.');
      }
      onCloseEditor();
    } catch (err: any) {
      console.error('Error saving task:', err);
      showNotification('Failed to save task.');
    }
  };

  const handleToggleStatus = async (task: TaskItem) => {
    const nextStatus: TaskItem['status'] = task.status === 'done' ? 'open' : 'done';
    // Optimistic local update
    const updated = currentTasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t));
    setCurrentTasks(updated);
    onReorderTasks?.(updated);

    await updateTask(task.id, { status: nextStatus });
    showNotification(nextStatus === 'done' ? 'Task marked complete!' : 'Task reopened.');
  };

  const handleDeleteTask = async (id: string) => {
    const updated = currentTasks.filter((t) => t.id !== id);
    setCurrentTasks(updated);
    onReorderTasks?.(updated);
    saveStoredTaskOrder(user?.uid, updated.map((t) => t.id));

    await deleteTask(id);
    showNotification('Task removed.');
    if (editingTask?.id === id) onCloseEditor();
  };

  const handleDuplicateTask = async (task: TaskItem) => {
    if (!user) return;
    await createTask({
      userId: user.uid,
      title: `${task.title} (Copy)`,
      description: task.description || '',
      status: 'open',
      priority: task.priority,
      category: task.category,
      dueAt: task.dueAt,
      order: currentTasks.length,
    });
    showNotification('Task duplicated.');
  };

  // Drag-and-drop reorder handler for List view
  const handleReorderTasks = async (newFilteredOrder: TaskItem[]) => {
    // If not currently in manual sort mode, switch to manual so visual order is respected
    if (sortBy !== 'manual') {
      setSortBy('manual');
    }

    // Merge the new relative order of the filtered tasks into the full tasks list
    const filteredIdSet = new Set(newFilteredOrder.map((t) => t.id));
    const mergedList: TaskItem[] = [];
    let nextFilteredIdx = 0;

    for (const item of currentTasks) {
      if (filteredIdSet.has(item.id)) {
        mergedList.push(newFilteredOrder[nextFilteredIdx++]);
      } else {
        mergedList.push(item);
      }
    }

    // Assign indexed order to all items
    const reorderedWithIndices = mergedList.map((task, idx) => ({
      ...task,
      order: idx,
    }));

    // Update local state and parent state immediately
    setCurrentTasks(reorderedWithIndices);
    onReorderTasks?.(reorderedWithIndices);

    // Save to localStorage for instant reload persistence
    saveStoredTaskOrder(user?.uid, reorderedWithIndices.map((t) => t.id));

    showNotification('Workflow priority updated.');

    // Asynchronously synchronize to Firestore
    try {
      await batchUpdateTaskOrders(
        reorderedWithIndices.map((t, idx) => ({
          id: t.id,
          order: idx,
        }))
      );
    } catch (err) {
      console.warn('Could not persist task orders to Firestore:', err);
    }
  };

  // Kanban drag-and-drop card status mover
  const handleMoveTaskStatus = async (taskId: string, newStatus: 'open' | 'in_progress' | 'done') => {
    const updated = currentTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    setCurrentTasks(updated);
    onReorderTasks?.(updated);

    const statusLabels = {
      open: 'To Do',
      in_progress: 'In Progress',
      done: 'Done',
    };

    showNotification(`Task moved to ${statusLabels[newStatus]}.`);
    await updateTask(taskId, { status: newStatus });
  };

  // AI Task actions
  const handleAIBreakdown = async () => {
    if (!title.trim()) {
      showNotification('Add a task title first.');
      return;
    }
    setAiLoading(true);
    try {
      const response = await askAI({
        prompt: `Break this task into 3-5 concrete subtasks and execution notes: "${title}". Description: "${description}". Format as checklist bullet points.`,
        mode: 'chat',
      });
      setDescription((prev) => (prev ? `${prev}\n\n### AI Subtasks:\n${response}` : response));
      showNotification('Subtasks suggested by AI.');
    } catch (err: any) {
      showNotification('AI service unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIOrganize = async () => {
    setAiLoading(true);
    try {
      const openTaskList = currentTasks
        .filter((t) => t.status !== 'done')
        .map((t) => `${t.title} (${t.priority} priority, category: ${t.category})`)
        .join(', ');

      const response = await askAI({
        prompt: `Based on my current open tasks: [${openTaskList}], organize them into a realistic schedule for tomorrow. Recommend which to tackle during morning deep work, afternoon, and wrap-up.`,
        mode: 'chat',
      });
      alert(`AI Plan for Tomorrow:\n\n${response}`);
    } catch (err: any) {
      showNotification('Could not organize tasks.');
    } finally {
      setAiLoading(false);
    }
  };

  // Filter tasks based on search and active filters
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredTasks = currentTasks.filter((t) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status / View filter
    if (activeFilter === 'today') {
      if (t.status === 'trashed') return false;
      if (t.status === 'done') return true;
      return t.dueAt === todayStr || !t.dueAt;
    }
    if (activeFilter === 'upcoming') {
      if (t.status === 'done' || t.status === 'trashed') return false;
      return t.dueAt ? t.dueAt > todayStr : true;
    }
    if (activeFilter === 'overdue') {
      if (t.status === 'done' || t.status === 'trashed') return false;
      return t.dueAt ? t.dueAt < todayStr : false;
    }
    if (activeFilter === 'completed') {
      return t.status === 'done';
    }

    // Priority filter
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

    return t.status !== 'trashed';
  });

  // Apply sorting for display
  const displayTasks = [...filteredTasks];
  if (sortBy === 'title') {
    displayTasks.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'due') {
    displayTasks.sort((a, b) => (a.dueAt || '').localeCompare(b.dueAt || ''));
  } else if (sortBy === 'priority') {
    const weight = { high: 3, medium: 2, low: 1 };
    displayTasks.sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0));
  }
  // When sortBy === 'manual', displayTasks keeps the exact visual sequence of currentTasks!

  const openCount = currentTasks.filter((t) => t.status !== 'done' && t.status !== 'trashed').length;
  const completedCount = currentTasks.filter((t) => t.status === 'done').length;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-5 right-5 z-[150] rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-xl animate-fade-in flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            Your execution system
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Make progress visible.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Drag and drop tasks to organize your focus, reorder priorities, and streamline your workflow.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
            {openCount} open · {completedCount} completed
          </span>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New task</span>
          </button>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <section className="flex flex-wrap items-center gap-2.5">
        {/* View mode toggle */}
        <div className="flex rounded-xl border border-[var(--color-border)] p-0.5 bg-[var(--color-surface)]">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted)]'
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'kanban' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted)]'
            }`}
          >
            Kanban
          </button>
        </div>

        {/* Filter chips */}
        {(['today', 'upcoming', 'overdue', 'completed', 'all'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all border ${
              activeFilter === filter
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            {filter}
          </button>
        ))}

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-muted)]">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-semibold text-[var(--color-text)] outline-none cursor-pointer"
            title="Choose task sorting mode"
          >
            <option value="manual">Sort: Manual (Drag &amp; Drop)</option>
            <option value="priority">Sort: Priority (High → Low)</option>
            <option value="due">Sort: Due Date</option>
            <option value="title">Sort: Title (A → Z)</option>
          </select>
        </div>

        {/* Priority dropdown */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] outline-none"
        >
          <option value="all">Priority: All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] outline-none"
        >
          <option value="all">Category: All</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Learning">Learning</option>
        </select>

        {/* Search input */}
        <div className="ml-auto flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs focus-within:border-[var(--color-primary)]">
          <Search className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>
      </section>

      {/* Main Grid: List/Kanban + AI Sidebar */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Views */}
        <div>
          {viewMode === 'list' && (
            <div className="space-y-3">
              {/* Drag-and-drop guideline bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--color-muted)]">
                <div className="flex items-center gap-1.5">
                  <GripVertical className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>
                    Drag tasks using the grip handle to visually reorder your execution priority.
                  </span>
                </div>
                {sortBy === 'manual' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                    Custom Priority Order Active
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSortBy('manual')}
                    className="text-[10px] font-bold text-[var(--color-primary)] hover:underline"
                  >
                    Switch to Manual Reorder
                  </button>
                )}
              </div>

              {/* Framer Motion Reorder Group for smooth vertical drag-and-drop */}
              <Reorder.Group
                axis="y"
                values={displayTasks}
                onReorder={handleReorderTasks}
                className="space-y-3"
              >
                {displayTasks.map((task, index) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    index={index}
                    isManualSort={sortBy === 'manual'}
                    onToggleStatus={handleToggleStatus}
                    onOpenEdit={handleOpenEdit}
                    onDuplicateTask={handleDuplicateTask}
                    onDeleteTask={handleDeleteTask}
                  />
                ))}
              </Reorder.Group>

              {displayTasks.length === 0 && (
                <div className="py-8">
                  <EmptyState
                    icon={CheckSquare}
                    title={searchQuery ? 'No matching tasks' : 'No tasks in this view'}
                    description={
                      searchQuery
                        ? 'Try changing your search terms or clearing your priority and category filters.'
                        : 'Organize your day, plan high-leverage goals, or break big projects into bite-sized actions.'
                    }
                    actionLabel={searchQuery ? 'Clear Search' : 'Create Task'}
                    onAction={searchQuery ? () => setSearchQuery('') : () => onOpenEditor()}
                  />
                </div>
              )}
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 px-1 text-xs text-[var(--color-muted)]">
                <Move className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Drag task cards across columns to update their workflow status.</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {(['open', 'in_progress', 'done'] as const).map((colStatus) => {
                  const colTasks = filteredTasks.filter((t) =>
                    colStatus === 'open'
                      ? t.status === 'open'
                      : colStatus === 'in_progress'
                      ? t.status === 'in_progress'
                      : t.status === 'done'
                  );
                  const colTitle =
                    colStatus === 'open' ? 'To Do' : colStatus === 'in_progress' ? 'In Progress' : 'Done';
                  const isOver = dragOverCol === colStatus;

                  return (
                    <div
                      key={colStatus}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverCol !== colStatus) setDragOverCol(colStatus);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDragOverCol(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const taskId = e.dataTransfer.getData('text/plain') || draggedKanbanTaskId;
                        setDragOverCol(null);
                        setDraggedKanbanTaskId(null);
                        if (taskId) {
                          handleMoveTaskStatus(taskId, colStatus);
                        }
                      }}
                      className={`rounded-3xl border transition-all p-4 space-y-3 ${
                        isOver
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)]/30'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                        <strong className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                          {colTitle}
                        </strong>
                        <span className="text-xs font-semibold text-[var(--color-muted)]">
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 min-h-[140px]">
                        {colTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', task.id);
                              setDraggedKanbanTaskId(task.id);
                            }}
                            onDragEnd={() => {
                              setDraggedKanbanTaskId(null);
                              setDragOverCol(null);
                            }}
                            onClick={() => handleOpenEdit(task)}
                            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 cursor-grab active:cursor-grabbing hover:border-[var(--color-primary)] transition-all shadow-sm select-none"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <strong className="block text-xs font-bold text-[var(--color-text)]">
                                {task.title}
                              </strong>
                              <GripVertical className="w-3.5 h-3.5 text-[var(--color-muted)] opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
                              <span className="capitalize">{task.priority}</span>
                              <span>{task.dueAt || 'No due date'}</span>
                            </div>
                          </div>
                        ))}

                        {colTasks.length === 0 && (
                          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] text-center text-[11px] text-[var(--color-muted)] opacity-60">
                            Drop tasks here
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* AI Task Manager & Tools */}
        <aside className="space-y-5">
          <section className="rounded-3xl border border-[var(--color-ai)]/40 bg-[color-mix(in_srgb,var(--color-ai-soft)_45%,var(--color-surface))] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-ai)]">
                  ✦ Smart Planning
                </p>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  AI Task Manager
                </h3>
              </div>
              <Sparkles className="w-5 h-5 text-[var(--color-ai)]" />
            </div>

            <p className="text-xs leading-5 text-[var(--color-muted)]">
              Let AI analyze your open commitments, recommend focus blocks, and organize your tasks for tomorrow.
            </p>

            <button
              type="button"
              disabled={aiLoading}
              onClick={handleAIOrganize}
              className="w-full rounded-xl bg-[var(--color-ai)] py-2.5 text-xs font-bold text-white hover:bg-[var(--color-ai)]/90 transition-all shadow-sm disabled:opacity-50"
            >
              {aiLoading ? 'Organizing with AI…' : 'Organize tasks for tomorrow →'}
            </button>

            <div className="space-y-1.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTitle('Prepare presentation slides');
                  handleAIBreakdown();
                }}
                className="w-full text-left rounded-lg border border-[var(--color-ai)]/30 bg-[var(--color-surface)]/60 px-3 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-ai)] transition-all"
              >
                Break task into subtasks
              </button>
              <button
                type="button"
                onClick={() => handleAIOrganize()}
                className="w-full text-left rounded-lg border border-[var(--color-ai)]/30 bg-[var(--color-surface)]/60 px-3 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-ai)] transition-all"
              >
                Suggest priority rankings
              </button>
            </div>
          </section>
        </aside>
      </div>

      {/* Task Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </p>
                <h3 className="text-lg font-bold text-[var(--color-text)]">
                  {editingTask ? 'Update task details' : 'Create a workspace task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseEditor}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Complete physics problem set"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[var(--color-muted)]">
                    Description &amp; Checklist
                  </label>
                  <button
                    type="button"
                    onClick={handleAIBreakdown}
                    disabled={aiLoading}
                    className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-ai)] hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{aiLoading ? 'Thinking…' : 'AI Breakdown'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, steps, or notes..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Learning">Learning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-2 text-xs text-[var(--color-text)] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-[var(--color-border)]">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id)}
                    className="text-xs font-bold text-red-400 hover:underline"
                  >
                    Delete task
                  </button>
                ) : <span />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCloseEditor}
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-sm"
                  >
                    Save task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
