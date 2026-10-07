/**
 * Smart Content & Video Recommendation Algorithm Engine
 * Evaluates interest alignment, engagement velocity, retention signals,
 * and recency decay to generate a personalized "For You" feed.
 */

export interface AlgorithmicItem {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewsCount?: number;
  completionRate?: number; // 0 to 1 (for Pulses/videos)
  createdAt: string;
  userId?: string;
  authorId?: string;
  authorName?: string;
  isCreator?: boolean;
}

export interface ScoredItem<T> {
  item: T;
  score: number;
  recommendationReason: string;
  matchedInterests: string[];
}

// User preference profile derived from interaction history
export interface UserAlgorithmProfile {
  interestedTags: string[];
  followedUserIds: Set<string>;
  likedItemIds: Set<string>;
  preferredContentTypes: ('video' | 'post' | 'code' | 'tutorial')[];
  freshnessWeight?: number; // 0 to 1
  popularityWeight?: number; // 0 to 1
}

const DEFAULT_INTERESTS = ['ai', 'code', 'design', 'productivity', 'study', 'builds', 'workflow', 'technology', 'creativity'];

const STORAGE_KEY_INTERESTS = 'paio_algorithm_interests';
const STORAGE_KEY_TUNING = 'paio_algorithm_tuning';

/**
 * Retrieves the current user algorithm profile from storage
 */
export function getStoredAlgorithmProfile(): UserAlgorithmProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTERESTS);
    const interests = raw ? JSON.parse(raw) : DEFAULT_INTERESTS;
    const tuningRaw = localStorage.getItem(STORAGE_KEY_TUNING);
    const tuning = tuningRaw ? JSON.parse(tuningRaw) : { freshness: 0.5, popularity: 0.5 };

    return {
      interestedTags: Array.isArray(interests) && interests.length > 0 ? interests : DEFAULT_INTERESTS,
      followedUserIds: new Set<string>(),
      likedItemIds: new Set<string>(),
      preferredContentTypes: ['video', 'post', 'code', 'tutorial'],
      freshnessWeight: tuning.freshness ?? 0.5,
      popularityWeight: tuning.popularity ?? 0.5,
    };
  } catch {
    return {
      interestedTags: DEFAULT_INTERESTS,
      followedUserIds: new Set<string>(),
      likedItemIds: new Set<string>(),
      preferredContentTypes: ['video', 'post', 'code', 'tutorial'],
      freshnessWeight: 0.5,
      popularityWeight: 0.5,
    };
  }
}

/**
 * Dynamic feedback loop: records interaction with tags to adapt algorithm in real-time
 */
export function recordAlgorithmInteraction(
  tags: string[] = [],
  interactionType: 'like' | 'share' | 'save' | 'comment' | 'watch'
) {
  try {
    const current = getStoredAlgorithmProfile();
    const cleanTags = tags.map((t) => t.toLowerCase().replace(/#/g, '').trim()).filter(Boolean);
    if (cleanTags.length === 0) return;

    const weight = interactionType === 'share' ? 3 : interactionType === 'save' ? 2 : 1;
    const existing = [...current.interestedTags];

    for (let i = 0; i < weight; i++) {
      for (const tag of cleanTags) {
        // Boost to front
        const idx = existing.indexOf(tag);
        if (idx !== -1) {
          existing.splice(idx, 1);
        }
        existing.unshift(tag);
      }
    }

    // Keep top 25 active interests
    const trimmed = Array.from(new Set(existing)).slice(0, 25);
    localStorage.setItem(STORAGE_KEY_INTERESTS, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Could not record algorithm interaction:', err);
  }
}

/**
 * Saves algorithm feed tuning weights
 */
export function saveAlgorithmTuning(freshness: number, popularity: number) {
  try {
    localStorage.setItem(STORAGE_KEY_TUNING, JSON.stringify({ freshness, popularity }));
  } catch (err) {
    console.warn('Could not save algorithm tuning:', err);
  }
}

/**
 * Calculates a dynamic algorithmic score for any post or video pulse
 */
export function calculateAlgorithmScore(
  item: AlgorithmicItem,
  userProfile?: Partial<UserAlgorithmProfile>
): { score: number; reason: string; matchedInterests: string[] } {
  const profile = userProfile || getStoredAlgorithmProfile();
  const now = Date.now();
  const createdTime = new Date(item.createdAt).getTime();
  const hoursAgo = Math.max(0.1, (now - createdTime) / (1000 * 60 * 60));

  // 1. Engagement Base Signals
  const likes = item.likesCount || 0;
  const comments = item.commentsCount || 0;
  const shares = item.sharesCount || 0;
  const views = item.viewsCount || Math.max(1, likes * 4);
  const completionRate = item.completionRate ?? 0.72; // default high retention for video

  const popularityFactor = 0.5 + (profile.popularityWeight ?? 0.5);
  const rawEngagement = (likes * 2.5 + comments * 4.0 + shares * 6.0 + views * 0.05) * popularityFactor;
  const retentionMultiplier = 1 + completionRate * 1.5;

  // 2. Interest Alignment Boost
  const itemTags = (item.tags || []).map((t) => t.toLowerCase().replace(/#/g, ''));
  const userInterests = profile.interestedTags || DEFAULT_INTERESTS;
  const matchedInterests = itemTags.filter((t) => userInterests.some((ui) => ui.includes(t) || t.includes(ui)));
  const interestBoost = matchedInterests.length > 0 ? 18 * matchedInterests.length : 4;

  // 3. Creator Credibility & Follower Affinity
  const isFollowing = profile.followedUserIds?.has(item.userId || item.authorId || '') ?? false;
  const affinityBoost = isFollowing ? 28 : item.isCreator ? 12 : 0;

  // 4. Gravity / Recency Decay with Freshness Weight
  // If user prefers fresher content, gravity exponent increases
  const freshnessFactor = 1.0 + (profile.freshnessWeight ?? 0.5) * 0.5;
  const timeDecay = Math.pow(hoursAgo + 1.8, freshnessFactor);

  const totalScore = ((rawEngagement * retentionMultiplier + interestBoost + affinityBoost) / timeDecay) * 10;

  // 5. Human-readable Recommendation Reason
  let reason = 'Trending in Community';
  if (matchedInterests.length > 0) {
    reason = `Recommended based on your interest in #${matchedInterests[0]}`;
  } else if (isFollowing) {
    reason = 'From a creator you follow';
  } else if (completionRate > 0.85) {
    reason = 'High engagement & 88% watch completion';
  } else if (shares > 3) {
    reason = 'Highly shared in workspace network';
  } else if (hoursAgo < 3) {
    reason = 'Freshly published breakthrough';
  }

  return {
    score: Math.round(totalScore * 100) / 100,
    reason,
    matchedInterests,
  };
}

/**
 * Sorts items by the smart algorithm for the "For You" feed
 */
export function rankBySmartAlgorithm<T extends AlgorithmicItem>(
  items: T[],
  userProfile?: Partial<UserAlgorithmProfile>
): ScoredItem<T>[] {
  const profile = userProfile || getStoredAlgorithmProfile();
  const scored = items.map((item) => {
    const { score, reason, matchedInterests } = calculateAlgorithmScore(item, profile);
    return {
      item,
      score,
      recommendationReason: reason,
      matchedInterests,
    };
  });

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score);
}
