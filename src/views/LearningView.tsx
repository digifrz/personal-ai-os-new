import React, { useState } from 'react';
import { BookOpen, Plus, Sparkles, RotateCw, CheckCircle2, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FlashcardItem } from '../types';
import { createFlashcard, updateFlashcard, deleteFlashcard } from '../services/db';
import { askAI } from '../services/ai';

interface LearningViewProps {
  flashcards: FlashcardItem[];
}

export const LearningView: React.FC<LearningViewProps> = ({ flashcards }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'study' | 'cards'>('study');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !front.trim() || !back.trim()) return;

    await createFlashcard({
      userId: user.uid,
      front: front.trim(),
      back: back.trim(),
    });

    setFront('');
    setBack('');
    setIsModalOpen(false);
    showToast('Flashcard created.');
  };

  const handleDelete = async (id: string) => {
    await deleteFlashcard(id);
    showToast('Flashcard deleted.');
  };

  const handleToggleMastered = async (card: FlashcardItem) => {
    await updateFlashcard(card.id, { isMastered: !card.isMastered });
    showToast(card.isMastered ? 'Marked for review' : 'Marked as mastered! 🎉');
  };

  const handleAIGenerate = async () => {
    if (!user || !topicInput.trim()) {
      showToast('Enter a study topic first.');
      return;
    }
    setAiLoading(true);
    try {
      const response = await askAI({
        prompt: `Generate 3 high-yield study flashcards for this topic: "${topicInput}". Format as lines with Front: [question/concept] | Back: [explanation/answer]`,
        mode: 'study_quiz',
      });

      const lines = response.split('\n');
      let count = 0;
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|');
          const f = parts[0].replace(/Front:\s*/i, '').trim();
          const b = parts[1].replace(/Back:\s*/i, '').trim();
          if (f && b) {
            await createFlashcard({
              userId: user.uid,
              front: f,
              back: b,
            });
            count++;
          }
        }
      }
      setTopicInput('');
      showToast(`Generated ${count} flashcards for "${topicInput}"!`);
    } catch (e) {
      showToast('Could not generate cards with AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[150] rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-xl animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-cyan)]">
            Active Recall &amp; Mastery
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Learning Center.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Study high-yield concepts, test memory recall, and retain knowledge permanently.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New flashcard</span>
          </button>
        </div>
      </section>

      {/* AI Flashcard Generator Bar */}
      <section className="rounded-3xl border border-[var(--color-ai)]/40 bg-[var(--color-ai-soft)]/25 p-5">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Sparkles className="w-5 h-5 text-[var(--color-ai)] shrink-0" />
          <div className="flex-1 min-w-0">
            <strong className="block text-xs font-bold text-[var(--color-text)]">
              AI Flashcard Generator
            </strong>
            <small className="text-[11px] text-[var(--color-muted)]">
              Type any topic, equation, or syllabus subject to automatically synthesize study cards.
            </small>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g., Quantum Mechanics, Systems Design"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none flex-1 sm:w-64"
            />
            <button
              type="button"
              disabled={aiLoading || !topicInput.trim()}
              onClick={handleAIGenerate}
              className="rounded-xl bg-[var(--color-ai)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-ai)]/90 disabled:opacity-40 transition-all shrink-0"
            >
              {aiLoading ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </section>

      {/* Mode tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('study')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
            activeTab === 'study'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
          }`}
        >
          Study Flip Mode
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cards')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
            activeTab === 'cards'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
          }`}
        >
          All Cards ({flashcards.length})
        </button>
      </div>

      {/* Main Mode */}
      {activeTab === 'study' ? (
        flashcards.length > 0 ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            {/* Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="group relative w-full max-w-xl h-80 rounded-3xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl cursor-pointer hover:border-[var(--color-primary)] flex flex-col justify-between transition-all select-none"
              style={{
                boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 0 20px rgba(139,92,246,0.1)',
              }}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--color-primary)] uppercase tracking-wider">
                  {isFlipped ? 'Answer / Concept' : 'Question / Prompt'}
                </span>
                <span className="text-[var(--color-muted)]">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
              </div>

              <div className="text-center my-auto">
                <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
                <small className="block mt-4 text-xs text-[var(--color-muted)]">
                  (Click card or press to flip)
                </small>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]/60 text-xs">
                <span className="text-[var(--color-muted)]">
                  Mastered: {currentCard.isMastered ? 'Yes' : 'No'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMastered(currentCard);
                  }}
                  className="text-[var(--color-cyan)] font-bold hover:underline"
                >
                  {currentCard.isMastered ? 'Mark for review' : 'Mark as mastered'}
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
                }}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flip</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
                }}
                className="rounded-xl bg-[var(--color-primary)] px-6 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--color-border)] p-12 text-center text-xs text-[var(--color-muted)]">
            No flashcards created yet. Click "New flashcard" or generate with AI above.
          </div>
        )
      ) : (
        /* All Cards Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3"
            >
              <div>
                <strong className="block text-xs font-bold text-[var(--color-text)]">
                  Q: {card.front}
                </strong>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  A: {card.back}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/60 text-xs">
                <span className={`text-[10px] font-bold ${card.isMastered ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {card.isMastered ? 'Mastered' : 'Review'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(card.id)}
                  className="text-[var(--color-muted)] hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flashcard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Create Flashcard
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Front (Question / Prompt)
                </label>
                <textarea
                  rows={3}
                  required
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="e.g., What is Heisenberg's Uncertainty Principle?"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Back (Explanation / Answer)
                </label>
                <textarea
                  rows={4}
                  required
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="e.g., The more precisely the position of some particle is determined, the less precisely its momentum can be known."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)]"
                >
                  Save flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
