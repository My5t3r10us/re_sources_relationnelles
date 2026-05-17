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
  resources: { total: number; published: number; pending: number };
  users: { total: number };
  comments: { total: number };
  reports: { pending: number };
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
