import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  DollarSign,
  Briefcase,
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  Sliders,
  Award,
  ArrowUpRight,
  ExternalLink,
  Shield,
  Film,
  Zap,
  Globe,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommunityPostItem, UserProfile } from '../../types';

interface CreatorStudioDashboardProps {
  posts: CommunityPostItem[];
  allProfiles?: UserProfile[];
  onShowToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const CreatorStudioDashboard: React.FC<CreatorStudioDashboardProps> = ({
  posts,
  allProfiles = [],
  onShowToast,
  onNavigateTab,
}) => {
  const { user, profile, updateUserProfile, accountType, setAccountType } = useAuth();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Creator Business settings
  const [creatorCategory, setCreatorCategory] = useState(() => {
    return localStorage.getItem('paio_creator_category') || 'AI & Tech Architect';
  });

  const [businessCta, setBusinessCta] = useState(() => {
    return localStorage.getItem('paio_creator_cta') || 'Send Business Inquiry';
  });

  const [businessEmail, setBusinessEmail] = useState(() => {
    return localStorage.getItem('paio_business_email') || user?.email || 'collaborate@creator.io';
  });

  const [tipJarEnabled, setTipJarEnabled] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyText, setAutoReplyText] = useState(
    'Thanks for reaching out! For collaboration or sponsorship inquiries, please note expected deliverables and timeline.'
  );

  const handleToggleAccountType = async (type: 'personal' | 'business') => {
    setAccountType(type);
    localStorage.setItem('paio_account_type', type);
    onShowToast(`Switched account mode to: ${type === 'business' ? '💼 Creator / Business Studio' : '👤 Personal Account'}`);
  };

  const handleSaveBusinessSettings = () => {
    localStorage.setItem('paio_creator_category', creatorCategory);
    localStorage.setItem('paio_creator_cta', businessCta);
    localStorage.setItem('paio_business_email', businessEmail);
    onShowToast('Creator studio & business settings saved!');
  };

  // Mock computed analytics
  const impressions = timeRange === '7d' ? '142,850' : timeRange === '30d' ? '584,200' : '1.42M';
  const reach = timeRange === '7d' ? '98,420' : timeRange === '30d' ? '392,000' : '960,000';
  const engagementRate = timeRange === '7d' ? '7.8%' : timeRange === '30d' ? '8.2%' : '7.5%';
  const newFollowers = timeRange === '7d' ? '+342' : timeRange === '30d' ? '+1,240' : '+3,890';
  const watchHours = timeRange === '7d' ? '214 hrs' : timeRange === '30d' ? '840 hrs' : '2,400 hrs';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 animate-fade-in text-left">
      {/* Top Banner: Mode Switcher & Overview */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface-elevated)] to-[var(--color-surface)] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 px-3 py-0.5 text-xs font-black text-[var(--color-primary)] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Creator &amp; Business Hub</span>
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Verified Creator
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
              Content Studio &amp; Business Center
            </h1>
            <p className="mt-1 text-xs text-[var(--color-muted)] max-w-xl">
              Professional analytics, audience demographics, monetization, and brand collaboration tools designed for creators and businesses.
            </p>
          </div>

          {/* Account Mode Toggle (Switch between Personal and Business) */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[11px] font-bold text-[var(--color-muted)]">Active Account Mode:</span>
            <div className="flex items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1">
              <button
                type="button"
                onClick={() => handleToggleAccountType('personal')}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  accountType === 'personal'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                👤 Personal
              </button>
              <button
                type="button"
                onClick={() => handleToggleAccountType('business')}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  accountType === 'business'
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 text-white shadow-md'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                💼 Business / Creator
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Time Range Filter Bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-extrabold text-[var(--color-text)] uppercase tracking-wider">
            Performance Overview
          </h2>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs font-bold">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`rounded-lg px-3 py-1 transition-all ${
                timeRange === r
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metric Highlights Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-bold">
            <span>Impressions</span>
            <Eye className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-[var(--color-text)]">{impressions}</div>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +18.4% vs prev
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-bold">
            <span>Unique Reach</span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-[var(--color-text)]">{reach}</div>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +12.1% growth
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-bold">
            <span>Engagement Rate</span>
            <Heart className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-[var(--color-text)]">{engagementRate}</div>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +1.4% retention
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-bold">
            <span>New Followers</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{newFollowers}</div>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Viral coefficient 1.8
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-bold">
            <span>Pulses Watch Time</span>
            <Film className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{watchHours}</div>
          <span className="text-[10px] text-cyan-300 font-bold">88% completion avg</span>
        </div>
      </section>

      {/* Grid: Audience Demographics & Top Performing Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audience Insights (5 cols) */}
        <section className="lg:col-span-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5 shadow-sm">
          <div>
            <h3 className="text-sm font-black text-[var(--color-text)]">
              Audience Demographics &amp; Timing
            </h3>
            <p className="text-xs text-[var(--color-muted)]">
              Understand who interacts with your content and when they are active.
            </p>
          </div>

          {/* Peak Hours Heatmap Bar */}
          <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--color-text)]">Peak Active Hours</span>
              <span className="text-[var(--color-primary)]">2:00 PM – 8:30 PM (UTC)</span>
            </div>
            <div className="grid grid-cols-8 gap-1 pt-1">
              {[20, 35, 45, 75, 95, 100, 85, 40].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-[var(--color-primary)] opacity-85 transition-all"
                    style={{ height: `${h * 0.4}px` }}
                  />
                  <span className="text-[9px] text-[var(--color-muted)]">{i * 3}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Audience Interests */}
          <div className="space-y-2 text-xs">
            <strong className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider block">
              Follower Core Interests
            </strong>
            <div className="space-y-2">
              {[
                { tag: 'AI & Machine Learning', pct: 46, color: 'bg-purple-500' },
                { tag: 'Autonomous Workflows', pct: 28, color: 'bg-cyan-500' },
                { tag: 'Minimalist UI / UX Design', pct: 16, color: 'bg-pink-500' },
                { tag: 'Full-Stack Software Architecture', pct: 10, color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.tag} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>{item.tag}</span>
                    <span className="text-[var(--color-muted)]">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Content Rankings (7 cols) */}
        <section className="lg:col-span-7 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[var(--color-text)]">
                Top Performing Posts &amp; Pulses
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Ranked by retention, reach, and community engagement.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--color-primary)]">Live Algorithm Score</span>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Building a 500 MB Encrypted Cloud Vault with Zero Telemetry 🛡️',
                type: 'Pulse Video',
                views: '44.2K',
                likes: 3840,
                comments: 215,
                retention: '96%',
              },
              {
                title: 'Minimalist Spatial UI for Modern Operating Systems 🎨',
                type: 'Pulse Video',
                views: '29.8K',
                likes: 2310,
                comments: 142,
                retention: '89%',
              },
              {
                title: 'Autonomous Multi-Agent Workflow in 45 Seconds ⚡',
                type: 'Post & Pulse',
                views: '18.4K',
                likes: 1420,
                comments: 88,
                retention: '94%',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-3.5 text-xs hover:border-[var(--color-primary)]/50 transition-all"
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black text-[var(--color-primary)]">#{idx + 1}</span>
                    <span className="rounded bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-primary)]">
                      {item.type}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">{item.retention} retention</span>
                  </div>
                  <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                    {item.title}
                  </strong>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right text-[11px] font-bold">
                  <div>
                    <span className="text-[var(--color-text)] block">{item.views}</span>
                    <span className="text-[9px] text-[var(--color-muted)] font-normal">views</span>
                  </div>
                  <div>
                    <span className="text-rose-400 block">{item.likes}</span>
                    <span className="text-[9px] text-[var(--color-muted)] font-normal">likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Creator Business Options & Settings Panel */}
      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-[var(--color-border)] pb-4">
          <h3 className="text-base font-extrabold text-[var(--color-text)]">
            Professional Profile &amp; Creator Business Tools
          </h3>
          <p className="text-xs text-[var(--color-muted)]">
            Configure badges, business call-to-actions, monetization tip jar, and automated inquiry replies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--color-muted)] mb-1">
              Professional Category Tag
            </label>
            <select
              value={creatorCategory}
              onChange={(e) => setCreatorCategory(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-[var(--color-text)] outline-none font-semibold"
            >
              <option value="AI & Tech Architect">AI &amp; Tech Architect</option>
              <option value="Digital Creator & Designer">Digital Creator &amp; Designer</option>
              <option value="Software Engineer & Researcher">Software Engineer &amp; Researcher</option>
              <option value="Tech Entrepreneur">Tech Entrepreneur</option>
              <option value="Educator & Writer">Educator &amp; Writer</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[var(--color-muted)] mb-1">
              Profile Call-To-Action (CTA) Button
            </label>
            <select
              value={businessCta}
              onChange={(e) => setBusinessCta(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-[var(--color-text)] outline-none font-semibold"
            >
              <option value="Send Business Inquiry">Send Business Inquiry</option>
              <option value="Book Consultation Call">Book Consultation Call</option>
              <option value="Collaborate on Projects">Collaborate on Projects</option>
              <option value="View Media Kit">View Media Kit</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[var(--color-muted)] mb-1">
              Public Business Contact Email
            </label>
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-[var(--color-text)] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--color-muted)] mb-1">
              Monetization: Creator Tip Jar &amp; Support
            </label>
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2">
              <span className="font-semibold text-emerald-400">Accept Community Tips ($5 / $10)</span>
              <button
                type="button"
                onClick={() => setTipJarEnabled(!tipJarEnabled)}
                className={`h-5 w-9 rounded-full transition-colors relative ${tipJarEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <span className={`block h-3.5 w-3.5 rounded-full bg-white transition-transform ${tipJarEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[var(--color-muted)]">
                Automated Inquiry Quick-Reply
              </label>
              <button
                type="button"
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className="text-[11px] font-bold text-[var(--color-primary)] hover:underline"
              >
                {autoReplyEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <textarea
              rows={2}
              value={autoReplyText}
              onChange={(e) => setAutoReplyText(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-[var(--color-text)] outline-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={handleSaveBusinessSettings}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-md"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Creator Settings</span>
          </button>
        </div>
      </section>
    </div>
  );
};
