import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Pin,
  Plus,
  Trash2,
  Compass,
  Filter,
  Image as ImageIcon,
  Wand2,
  X,
  Check,
  Calendar,
  Tag,
  ArrowUpRight,
  ExternalLink,
  Layers,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VisionBoardItem } from '../types';
import { createVisionItem, togglePinVisionItem, deleteVisionItem } from '../services/db';
import { generateVisionImageAI } from '../services/ai';

interface VisionBoardViewProps {
  items: VisionBoardItem[];
  onOpenUpgrade?: () => void;
}

const CATEGORY_META: Record<VisionBoardItem['category'], { label: string; color: string }> = {
  career: { label: 'Career & Ambition', color: 'text-indigo-400' },
  travel: { label: 'Travel & Exploration', color: 'text-cyan-400' },
  wealth: { label: 'Wealth & Freedom', color: 'text-emerald-400' },
  wellness: { label: 'Health & Vitality', color: 'text-rose-400' },
  learning: { label: 'Wisdom & Mastery', color: 'text-amber-400' },
  lifestyle: { label: 'Lifestyle & Design', color: 'text-violet-400' },
};

const INSPIRATION_IDEAS = [
  'Modern minimalist executive penthouse workspace overlooking city lights at dusk',
  'Majestic snow-capped mountain summit rising above a sea of golden clouds at sunrise',
  'Sunlit Scandinavian creative architecture design studio with lush fiddle-leaf plants',
  'Futuristic cybernetic neural AI data flow glowing with violet and cyan lasers',
  'Luxury glass coastal villa overlooking the Mediterranean Sea at sunset',
  'Keynote speaker on stage in front of thousands at world tech summit',
];

export const VisionBoardView: React.FC<VisionBoardViewProps> = ({ items, onOpenUpgrade }) => {
  const { user, profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Vision Item Form State
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [category, setCategory] = useState<VisionBoardItem['category']>('career');
  const [targetYear, setTargetYear] = useState(() => (new Date().getFullYear() + 1).toString());
  const [imageUrl, setImageUrl] = useState('/src/assets/images/vision_deep_focus_1792340279405.jpg');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (onlyPinned && !item.isPinned) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      return true;
    });
  }, [items, onlyPinned, selectedCategory]);

  const pinnedCount = useMemo(() => items.filter((i) => i.isPinned).length, [items]);

  const handleGenerateAIImage = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) return;

    setIsGeneratingImage(true);
    try {
      const generated = await generateVisionImageAI(promptToUse);
      setImageUrl(generated);
      showToast('AI inspiration visual generated! Review and pin to board.');
    } catch (e) {
      console.warn('AI image gen error:', e);
      showToast('Loaded inspiration visual from library.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    try {
      await createVisionItem({
        userId: user?.uid || 'guest_user',
        title: title.trim(),
        caption: caption.trim() || undefined,
        affirmation: affirmation.trim() || undefined,
        category,
        targetYear: targetYear.trim() || undefined,
        imageUrl: imageUrl.trim(),
        isPinned: true,
      });

      setTitle('');
      setCaption('');
      setAffirmation('');
      setAiPrompt('');
      setIsModalOpen(false);
      showToast(`Pinned "${title.trim()}" to your Vision Board ✨`);
    } catch (e) {
      console.warn('Create vision item error:', e);
    }
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    try {
      const next = await togglePinVisionItem(id, current);
      showToast(next ? 'Pinned to top of Vision Board' : 'Unpinned from top');
    } catch (e) {
      console.warn('Toggle pin error:', e);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!confirm(`Remove "${itemTitle}" from your Vision Board?`)) return;
    try {
      await deleteVisionItem(id);
      showToast('Vision item removed.');
    } catch (e) {
      console.warn('Delete vision item error:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 rounded-2xl border border-indigo-500/40 bg-zinc-900/95 backdrop-blur-xl px-4 py-3 text-xs font-bold text-indigo-300 shadow-2xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-medium">
            <span>Aspirations &amp; Manifestation</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-indigo-400 font-bold">{items.length} Vision Pins</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-amber-400 font-bold">{pinnedCount} Pinned Highlights</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)] mt-1 flex items-center gap-2.5">
            <span>Vision Board &amp; Aspirations</span>
            <span className="rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
              Imagen 3 AI Powered
            </span>
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Pin motivational visuals, future milestones, and mental anchors to align your daily actions with your biggest dreams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenUpgrade && (
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all shrink-0"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>OS Pro Tier</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 px-4 py-2 text-xs font-black text-white shadow-lg hover:brightness-110 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Pin New Vision</span>
          </button>
        </div>
      </header>

      {/* Filter Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-x-auto">
          {['all', 'career', 'travel', 'wealth', 'wellness', 'learning', 'lifestyle'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all capitalize whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Pinned Only Toggle */}
        <button
          type="button"
          onClick={() => setOnlyPinned(!onlyPinned)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            onlyPinned
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Pin className={`w-3.5 h-3.5 ${onlyPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{onlyPinned ? 'Showing Pinned Only' : 'Filter Pinned'}</span>
        </button>
      </div>

      {/* Vision Pins Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => {
          const meta = CATEGORY_META[item.category] || CATEGORY_META.career;

          return (
            <div
              key={item.id}
              className={`group relative flex flex-col rounded-3xl bg-[var(--color-surface)] border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${
                item.isPinned ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-lg' : 'border-[var(--color-border)]'
              }`}
            >
              {/* Pin Accent Badge */}
              <button
                type="button"
                onClick={() => handleTogglePin(item.id, !!item.isPinned)}
                title={item.isPinned ? 'Unpin from highlights' : 'Pin to highlights'}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
                  item.isPinned
                    ? 'bg-amber-500 text-black shadow-amber-500/30'
                    : 'bg-black/50 text-white/70 opacity-0 group-hover:opacity-100 hover:text-amber-300'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-black' : ''}`} />
              </button>

              {/* Visual Card Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-80" />

                {item.targetYear && (
                  <span className="absolute bottom-2.5 left-3 font-mono text-[10px] font-black uppercase tracking-widest text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                    Target: {item.targetYear}
                  </span>
                )}
              </div>

              {/* Card Text & Goal Snippets */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                    <span className="text-[var(--color-muted)] font-mono">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-[var(--color-text)] leading-snug">
                    {item.title}
                  </h3>

                  {item.caption && (
                    <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                      {item.caption}
                    </p>
                  )}
                </div>

                {/* Motivational Affirmation Quote Snippet */}
                {item.affirmation && (
                  <div className="p-2.5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[11px] italic text-indigo-300 font-serif">
                    "{item.affirmation}"
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50 text-[10px] text-[var(--color-muted)]">
                  <span className="font-mono">Mental Anchor</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-red-400 transition-opacity"
                    title="Delete vision pin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
            <Compass className="w-10 h-10 text-[var(--color-muted)]/50 mx-auto" />
            <h3 className="text-sm font-bold text-[var(--color-text)]">No vision pins match your filter</h3>
            <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto">
              Create your first vision anchor to manifest what you want to achieve this year.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Pin First Vision
            </button>
          </div>
        )}
      </div>

      {/* Pin New Vision Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-[var(--color-text)]">Pin Vision to Board</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Inspiration Generator Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-violet-950/20 to-[var(--color-bg-secondary)] border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Imagen 3 AI Vision Generator</span>
                </span>
                {isGeneratingImage && (
                  <span className="text-[10px] text-indigo-400 animate-pulse font-mono">
                    Generating photorealistic visual...
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Describe your aspiration (e.g. Penthouse high-tech developer sanctuary)"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleGenerateAIImage()}
                  disabled={isGeneratingImage || !aiPrompt.trim()}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-all disabled:opacity-40 shrink-0"
                >
                  Generate Visual
                </button>
              </div>

              {/* Quick Prompt Starters */}
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--color-muted)] block">Or pick an inspirational starter:</span>
                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_IDEAS.slice(0, 4).map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPrompt(idea);
                        handleGenerateAIImage(idea);
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-[var(--color-text)] border border-white/5 transition-all text-left truncate max-w-xs"
                    >
                      {idea.slice(0, 45)}…
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[var(--color-border)] bg-black/40">
              <img
                src={imageUrl}
                alt="Vision preview"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white/90 font-mono">
                Current Visual Anchor
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[var(--color-text)] mb-1">Goal or Vision Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Architect at Frontier AI Lab, Run Marathon in Swiss Alps"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--color-text)] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="career">Career &amp; Ambition</option>
                    <option value="travel">Travel &amp; Exploration</option>
                    <option value="wealth">Wealth &amp; Freedom</option>
                    <option value="wellness">Health &amp; Vitality</option>
                    <option value="learning">Wisdom &amp; Mastery</option>
                    <option value="lifestyle">Lifestyle &amp; Design</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-text)] mb-1">Target Horizon / Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2027, Q4 2026, Lifelong"
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--color-text)] mb-1">Action Snippet / Description</label>
                <textarea
                  rows={2}
                  placeholder="Concrete milestones or daily routines needed to manifest this..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--color-text)] mb-1">Personal Affirmation Mantra</label>
                <input
                  type="text"
                  placeholder="e.g. I have the discipline and creativity to build transformational software."
                  value={affirmation}
                  onChange={(e) => setAffirmation(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none italic font-serif"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-muted)] hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                >
                  Pin Vision to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
