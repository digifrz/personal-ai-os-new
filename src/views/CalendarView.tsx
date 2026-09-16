import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  MapPin,
  Trash2,
  Copy,
  X,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CalendarEventItem } from '../types';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../services/db';
import { askAI } from '../services/ai';

interface CalendarViewProps {
  events: CalendarEventItem[];
  isEditorOpen: boolean;
  onCloseEditor: () => void;
  onOpenEditor: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  isEditorOpen,
  onCloseEditor,
  onOpenEditor,
}) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [activeToolTab, setActiveToolTab] = useState<'time' | 'alarm'>('time');

  // Alarm system
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [alarmRepeat, setAlarmRepeat] = useState<'once' | 'daily' | 'weekdays'>('once');
  const [alarms, setAlarms] = useState<Array<{ id: string; label: string; time: string; repeat: string }>>([]);

  // Event editor form state
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('work');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>('');
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  useEffect(() => {
    const saved = localStorage.getItem('personal-ai-os-calendar-alarms');
    if (saved) {
      try {
        setAlarms(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Alarm checker
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHhMm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      alarms.forEach((alarm) => {
        if (alarm.time === currentHhMm && now.getSeconds() === 0) {
          playAlarmSound();
          showToast(`⏰ Alarm: ${alarm.label || 'Calendar alert'}`);
        }
      });
    };
    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [alarms]);

  const playAlarmSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  const handleAddAlarm = () => {
    if (!alarmTime) return showToast('Please choose an alarm time.');
    const newAlarms = [
      ...alarms,
      {
        id: Date.now().toString(),
        label: alarmLabel.trim() || 'Calendar Alarm',
        time: alarmTime,
        repeat: alarmRepeat,
      },
    ];
    setAlarms(newAlarms);
    localStorage.setItem('personal-ai-os-calendar-alarms', JSON.stringify(newAlarms));
    setAlarmLabel('');
    setAlarmTime('');
    showToast('Alarm scheduled.');
  };

  const handleRemoveAlarm = (id: string) => {
    const newAlarms = alarms.filter((a) => a.id !== id);
    setAlarms(newAlarms);
    localStorage.setItem('personal-ai-os-calendar-alarms', JSON.stringify(newAlarms));
    showToast('Alarm removed.');
  };

  const handleOpenCreate = (targetDateStr?: string) => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setCategory('work');
    setDate(targetDateStr || new Date().toISOString().slice(0, 10));
    setTime('14:00');
    setEndTime('15:00');
    setAllDay(false);
    setLocation('');
    setReminderMinutes('');
    setRecurrenceRule('');
    onOpenEditor();
  };

  const handleOpenEdit = (event: CalendarEventItem) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setCategory(event.category);
    const starts = new Date(event.startsAt);
    setDate(starts.toISOString().slice(0, 10));
    setTime(starts.toTimeString().slice(0, 5));
    if (event.endsAt) {
      setEndTime(new Date(event.endsAt).toTimeString().slice(0, 5));
    } else {
      setEndTime('15:00');
    }
    setAllDay(Boolean(event.allDay));
    setLocation(event.location || '');
    setReminderMinutes(event.reminderMinutes ?? '');
    setRecurrenceRule(event.recurrenceRule || '');
    onOpenEditor();
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !date) return;

    const startsAt = allDay
      ? `${date}T00:00:00.000Z`
      : `${date}T${time || '09:00'}:00.000Z`;

    const endsAt = allDay
      ? null
      : `${date}T${endTime || time || '10:00'}:00.000Z`;

    try {
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          startsAt,
          endsAt,
          allDay,
          location: location.trim(),
          reminderMinutes: reminderMinutes !== '' ? Number(reminderMinutes) : null,
          recurrenceRule: recurrenceRule || null,
        });
        showToast('Event updated.');
      } else {
        await createCalendarEvent({
          userId: user.uid,
          title: title.trim(),
          description: description.trim(),
          category,
          startsAt,
          endsAt,
          allDay,
          timezone: selectedTimezone,
          location: location.trim(),
          reminderMinutes: reminderMinutes !== '' ? Number(reminderMinutes) : null,
          recurrenceRule: recurrenceRule || null,
        });
        showToast('Event created.');
      }
      onCloseEditor();
    } catch (err) {
      showToast('Could not save event.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteCalendarEvent(id);
    showToast('Event deleted.');
    if (editingEvent?.id === id) onCloseEditor();
  };

  const handleDuplicateEvent = async (event: CalendarEventItem) => {
    if (!user) return;
    await createCalendarEvent({
      userId: user.uid,
      title: `${event.title} (Copy)`,
      description: event.description,
      category: event.category,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      allDay: event.allDay,
      timezone: event.timezone,
      location: event.location,
    });
    showToast('Event duplicated.');
  };

  const handleAISchedule = async () => {
    showToast('Consulting AI Scheduler…');
    try {
      const scheduleAnswer = await askAI({
        prompt: `Based on my current calendar events: ${JSON.stringify(events)}, suggest an optimal 2-hour uninterrupted focus block for deep work tomorrow.`,
        mode: 'chat',
      });
      alert(`AI Scheduling Recommendation:\n\n${scheduleAnswer}`);
    } catch (e) {
      showToast('Could not schedule with AI.');
    }
  };

  // Month rendering math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday start
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const filteredEvents = events.filter((e) => {
    if (selectedCategory !== 'all' && e.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    return true;
  });

  const categoryColor: Record<string, string> = {
    work: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    personal: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    learning: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[150] rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-xl animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            Your time, organized
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Make space for what matters.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            See your schedule clearly, protect deep work, and keep your commitments synchronized.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
            {events.length} events scheduled
          </span>
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New event</span>
          </button>
        </div>
      </section>

      {/* Controls & Tools Bar */}
      <section className="flex flex-wrap items-center gap-2">
        {/* View Mode */}
        <div className="flex rounded-xl border border-[var(--color-border)] p-0.5 bg-[var(--color-surface)]">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition-all ${
                viewMode === mode ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted)]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] outline-none"
        >
          <option value="all">Category: All</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="learning">Learning</option>
        </select>

        {/* Timezone Selector */}
        <select
          value={selectedTimezone}
          onChange={(e) => setSelectedTimezone(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] outline-none"
        >
          <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
            Timezone: Local ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time (US)</option>
          <option value="America/Los_Angeles">Pacific Time (US)</option>
          <option value="Europe/London">London (GMT/BST)</option>
        </select>
      </section>

      {/* Time & Alarm Tools Bar */}
      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
          <button
            type="button"
            onClick={() => setActiveToolTab('time')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              activeToolTab === 'time'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-muted)] hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Local Clock</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveToolTab('alarm')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              activeToolTab === 'alarm'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-muted)] hover:bg-white/5'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Calendar Alarm ({alarms.length})</span>
          </button>
        </div>

        {activeToolTab === 'time' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-muted)]">
                Live Zone
              </p>
              <strong className="text-3xl font-extrabold text-[var(--color-cyan)]">
                {currentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
              </strong>
              <small className="block text-xs text-[var(--color-muted)]">
                {selectedTimezone} · {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </small>
            </div>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="self-start sm:self-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)]"
            >
              Sync to current time
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={alarmLabel}
                onChange={(e) => setAlarmLabel(e.target.value)}
                placeholder="Alarm name (e.g. Physics lecture)"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
              />
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
              />
              <select
                value={alarmRepeat}
                onChange={(e) => setAlarmRepeat(e.target.value as any)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
              >
                <option value="once">Once</option>
                <option value="daily">Every day</option>
                <option value="weekdays">Weekdays</option>
              </select>
              <button
                type="button"
                onClick={handleAddAlarm}
                className="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)]"
              >
                Add alarm
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {alarms.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                  <strong>{a.label}</strong>
                  <span className="text-[var(--color-cyan)]">{a.time}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAlarm(a.id)}
                    className="text-[var(--color-muted)] hover:text-red-400 font-bold ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              {alarms.length === 0 && (
                <p className="text-xs text-[var(--color-muted)]">No alarms scheduled.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Main Calendar Display */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div>
          {/* Calendar Nav Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 border-b border-[var(--color-border)] text-center text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] py-3">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              <div className="grid grid-cols-7 gap-px bg-[var(--color-border)]">
                {/* Prev month overflow */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div
                    key={`prev-${i}`}
                    className="min-h-[100px] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-muted)] opacity-30"
                  >
                    <span>{prevMonthDays - firstDayIndex + i + 1}</span>
                  </div>
                ))}

                {/* Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isToday =
                    new Date().getDate() === dayNum &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;

                  const dayEvents = filteredEvents.filter((e) => e.startsAt.startsWith(dateStr));

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleOpenCreate(dateStr)}
                      className={`min-h-[100px] bg-[var(--color-surface)] p-2 transition-colors cursor-pointer hover:bg-white/[0.02] ${
                        isToday ? 'bg-[var(--color-primary)]/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            isToday
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'text-[var(--color-muted)]'
                          }`}
                        >
                          {dayNum}
                        </span>
                      </div>

                      <div className="mt-1.5 space-y-1">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(evt);
                            }}
                            className={`rounded-lg border px-2 py-1 text-[10px] font-bold truncate transition-all ${
                              categoryColor[evt.category.toLowerCase()] || categoryColor.work
                            }`}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week & Day views */}
          {viewMode !== 'month' && (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center space-y-3">
              <CalendarIcon className="w-8 h-8 mx-auto text-[var(--color-primary)]" />
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                {viewMode === 'week' ? 'Week Agenda' : 'Day Focus Schedule'}
              </h3>
              <div className="space-y-2 max-w-md mx-auto text-left">
                {filteredEvents.slice(0, 8).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => handleOpenEdit(evt)}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 cursor-pointer hover:border-[var(--color-primary)]"
                  >
                    <div>
                      <strong className="text-xs font-bold text-[var(--color-text)] block">
                        {evt.title}
                      </strong>
                      <small className="text-[11px] text-[var(--color-muted)]">
                        {new Date(evt.startsAt).toLocaleDateString()} at {new Date(evt.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </small>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-primary)]">
                      {evt.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Scheduler & Upcoming Sidebar */}
        <aside className="space-y-5">
          <section className="rounded-3xl border border-[var(--color-ai)]/40 bg-[color-mix(in_srgb,var(--color-ai-soft)_45%,var(--color-surface))] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-ai)]">
                  ✦ Smart Scheduling
                </p>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  AI Calendar Assistant
                </h3>
              </div>
              <Sparkles className="w-5 h-5 text-[var(--color-ai)]" />
            </div>

            <p className="text-xs leading-5 text-[var(--color-muted)]">
              Ask AI to find available time slots, balance study sessions, and protect your evening deep work hours.
            </p>

            <button
              type="button"
              onClick={handleAISchedule}
              className="w-full rounded-xl bg-[var(--color-ai)] py-2.5 text-xs font-bold text-white hover:bg-[var(--color-ai)]/90 transition-all shadow-sm"
            >
              Schedule deep work with AI →
            </button>
          </section>

          {/* Upcoming Events List */}
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Upcoming Agenda
            </h3>

            <div className="space-y-3">
              {events.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => handleOpenEdit(evt)}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-secondary)]/50 p-3 cursor-pointer hover:border-[var(--color-primary)] transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-xs font-bold">
                    <span>{new Date(evt.startsAt).getDate()}</span>
                    <small className="text-[9px] uppercase">
                      {new Date(evt.startsAt).toLocaleDateString([], { month: 'short' })}
                    </small>
                  </div>

                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                      {evt.title}
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {new Date(evt.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      {evt.location && ` · ${evt.location}`}
                    </p>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <p className="py-6 text-center text-xs text-[var(--color-muted)]">
                  No events scheduled yet.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Event Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </p>
                <h3 className="text-lg font-bold text-[var(--color-text)]">
                  {editingEvent ? 'Modify calendar commitment' : 'Schedule on your calendar'}
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

            <form onSubmit={handleSaveEvent} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Physics Focus Block"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                  />
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
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="learning">Learning</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="allDayCheck"
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="accent-[var(--color-primary)]"
                />
                <label htmlFor="allDayCheck" className="text-xs font-semibold text-[var(--color-muted)]">
                  All-day event
                </label>
              </div>

              {!allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Location or Meeting Link
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Library / Google Meet link"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Notes &amp; Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details for this event..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-[var(--color-border)]">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(editingEvent.id)}
                    className="text-xs font-bold text-red-400 hover:underline"
                  >
                    Delete event
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
                    Save event
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
