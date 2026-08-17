export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { page: number; limit: number; total: number };
}

export type UserRole = 'citizen' | 'moderator' | 'admin' | 'super_admin';
export type ResourceStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'flagged';
export type ResourcePrivacy = 'public' | 'private';
export type MediaType = 'article' | 'video' | 'pdf' | 'exercise' | 'audio' | 'protocol';
export type CommentStatus = 'visible' | 'hidden' | 'flagged';
export type ReportReason = 'harassment' | 'spam' | 'misinformation' | 'inappropriate' | 'other';
export type SessionStatus = 'active' | 'ended';

export interface User {
  id: string;
  name: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  active: boolean;
  image: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  summary: string | null;
  content?: string;
  mediaType: MediaType;
  privacy: ResourcePrivacy;
  status: ResourceStatus;
  imageUrl: string | null;
  readingTime: number | null;
  featured: boolean;
  viewCount: number;
  region: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  authorId: string;
  authorName: string | null;
  files?: ResourceFile[];
  isFavorite?: boolean;
  isRead?: boolean;
  isSaved?: boolean;
}

export interface ResourceFile {
  id: string;
  url: string;
  name: string;
  contentType: string;
}

export interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  status: CommentStatus;
  likes: number;
  createdAt: string;
  authorId: string;
  authorName: string | null;
}

export interface AdminStats {
  filters: {
    period: 'all' | '7d' | '30d' | '90d' | '12m';
    mediaType: MediaType | 'all';
    categoryId: string;
    region: string;
  };
  period: { label: string; start: string; end: string; grain: 'day' | 'week' };
  metrics: {
    users: number;
    resources: number;
    views: number;
    pendingResources: number;
    publishedResources: number;
    reports: number;
    unresolvedReports: number;
    comments: number;
  };
  engagement: {
    favorites: number;
    completions: number;
    savedResources: number;
    completionRate: number;
  };
  moderation: {
    averagePublicationHours: number;
    hiddenComments: number;
    resolvedShare: number;
    reportsByReason: { reason: string; resolved: number; unresolved: number }[];
  };
  timeline: {
    date: string;
    label: string;
    resources: number;
    users: number;
    comments: number;
    views: number;
  }[];
  byCategory: { name: string; count: number }[];
  byMediaType: { mediaType: string; count: number }[];
  byRole: { role: string; count: number }[];
  byRegion: { region: string; resources: number; views: number }[];
  topViewed: { id: string; title: string; category: string | null; author: string; count: number }[];
  topFavorited: { id: string; title: string; category: string | null; author: string; count: number }[];
  contributors: { id: string; name: string; count: number }[];
  options: { categories: { id: string; name: string }[]; regions: string[] };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reason: string;
  description: string | null;
  resolved: boolean;
  createdAt: string;
  resourceId: string | null;
  resourceTitle: string | null;
  commentId: string | null;
  reporterId: string;
  reporterName: string | null;
  reporterEmail: string | null;
}

export interface SessionParticipant {
  id: string;
  userId: string;
  userName: string | null;
  joinedAt: string;
  leftAt: string | null;
}

export interface SessionMessage {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
}

export interface ResourceSession {
  id: string;
  shareCode: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  hostId: string;
  hostName: string | null;
  resourceId: string;
  resourceTitle: string;
  resourceMediaType: MediaType;
  participants: SessionParticipant[];
}
