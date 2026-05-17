import { useAuthStore } from '@/stores/auth';
import type {
  ApiResponse,
  Resource,
  Category,
  Comment,
  User,
  AdminStats,
  AdminUser,
  Report,
  ReportReason,
  ResourceSession,
  SessionMessage,
  UserRole,
} from '@/types/api';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  return res.json() as Promise<ApiResponse<T>>;
}

// ─── Auth ───

export const auth = {
  signIn: (email: string, password: string) =>
    fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json()),

  signUp: (data: { email: string; password: string; name: string; firstName?: string; lastName?: string }) =>
    fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  signOut: () => {
    const token = useAuthStore.getState().token;
    return fetch(`${BASE_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
};

// ─── Categories ───

export const categories = {
  list: () => apiFetch<Category[]>('/api/v1/categories'),
};

// ─── Resources ───

export const resources = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    mediaType?: string;
    status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.category) q.set('category', params.category);
    if (params?.mediaType) q.set('mediaType', params.mediaType);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return apiFetch<Resource[]>(`/api/v1/resources${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => apiFetch<Resource>(`/api/v1/resources/${id}`),

  create: (data: {
    title: string;
    content: string;
    summary?: string;
    mediaType?: string;
    categoryId?: string | null;
    privacy?: string;
    isDraft?: boolean;
    imageUrl?: string | null;
  }) => apiFetch<Resource>('/api/v1/resources', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: object) =>
    apiFetch<Resource>(`/api/v1/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/v1/resources/${id}`, { method: 'DELETE' }),

  toggleFavorite: (id: string) =>
    apiFetch<{ isFavorite: boolean }>(`/api/v1/resources/${id}/favorite`, { method: 'POST' }),

  toggleRead: (id: string) =>
    apiFetch<{ isRead: boolean }>(`/api/v1/resources/${id}/read`, { method: 'POST' }),

  toggleSave: (id: string) =>
    apiFetch<{ isSaved: boolean }>(`/api/v1/resources/${id}/save`, { method: 'POST' }),
};

// ─── Comments ───

export const comments = {
  list: (resourceId: string) => apiFetch<Comment[]>(`/api/v1/resources/${resourceId}/comments`),

  create: (resourceId: string, content: string, parentId?: string) =>
    apiFetch<Comment>(`/api/v1/resources/${resourceId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    }),

  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/v1/comments/${id}`, { method: 'DELETE' }),

  toggleLike: (id: string) =>
    apiFetch<{ liked: boolean }>(`/api/v1/comments/${id}/like`, { method: 'POST' }),
};

// ─── Me ───

export const me = {
  get: () => apiFetch<User>('/api/v1/me'),

  update: (data: { name?: string; firstName?: string; lastName?: string; image?: string }) =>
    apiFetch<User>('/api/v1/me', { method: 'PUT', body: JSON.stringify(data) }),

  resources: () => apiFetch<Resource[]>('/api/v1/me/resources'),

  favorites: () => apiFetch<Resource[]>('/api/v1/me/favorites'),

  saved: () => apiFetch<Resource[]>('/api/v1/me/saved'),

  completions: () => apiFetch<Resource[]>('/api/v1/me/completions'),

  submitDraft: (id: string) =>
    apiFetch<{ id: string; status: string }>(`/api/v1/me/resources/${id}/submit`, { method: 'POST' }),
};

// ─── Reports (user-facing) ───

export const reports = {
  create: (data: { reason: ReportReason; description?: string; resourceId?: string; commentId?: string }) =>
    apiFetch<{ id: string }>('/api/v1/reports', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Collaborative sessions ───

export const sessions = {
  start: (resourceId: string) =>
    apiFetch<ResourceSession>(`/api/v1/resources/${resourceId}/sessions`, { method: 'POST' }),

  get: (code: string) => apiFetch<ResourceSession>(`/api/v1/sessions/${code}`),

  end: (code: string) =>
    apiFetch<{ id: string; status: string }>(`/api/v1/sessions/${code}`, { method: 'DELETE' }),

  join: (code: string) =>
    apiFetch<{ joined: boolean }>(`/api/v1/sessions/${code}/join`, { method: 'POST' }),

  leave: (code: string) =>
    apiFetch<{ left: boolean }>(`/api/v1/sessions/${code}/leave`, { method: 'POST' }),

  getMessages: (code: string, since?: string) => {
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiFetch<SessionMessage[]>(`/api/v1/sessions/${code}/messages${qs}`);
  },

  sendMessage: (code: string, content: string) =>
    apiFetch<SessionMessage>(`/api/v1/sessions/${code}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

// ─── Admin ───

export const admin = {
  stats: () => apiFetch<AdminStats>('/api/v1/admin/stats'),

  resources: {
    list: (params?: { page?: number; status?: string; featured?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.status) q.set('status', params.status);
      if (params?.featured !== undefined) q.set('featured', String(params.featured));
      const qs = q.toString();
      return apiFetch<Resource[]>(`/api/v1/admin/resources${qs ? `?${qs}` : ''}`);
    },
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/admin/resources/${id}`, { method: 'DELETE' }),
    setStatus: (id: string, status: string) =>
      apiFetch<{ id: string; status: string }>(`/api/v1/admin/resources/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    setFeatured: (id: string, featured: boolean) =>
      apiFetch<{ id: string; featured: boolean }>(`/api/v1/admin/resources/${id}/featured`, {
        method: 'PUT',
        body: JSON.stringify({ featured }),
      }),
  },

  users: {
    list: (page = 1) => apiFetch<AdminUser[]>(`/api/v1/admin/users?page=${page}`),
    create: (data: { name: string; email: string; password: string; role: Exclude<UserRole, 'citizen'> }) =>
      apiFetch<{ id: string }>('/api/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    setRole: (id: string, role: string) =>
      apiFetch<{ id: string; role: string }>(`/api/v1/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    toggleActive: (id: string) =>
      apiFetch<{ id: string; active: boolean }>(`/api/v1/admin/users/${id}/active`, { method: 'PUT' }),
  },

  comments: {
    list: (params?: { page?: number; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.status) q.set('status', params.status);
      const qs = q.toString();
      return apiFetch<Comment[]>(`/api/v1/admin/comments${qs ? `?${qs}` : ''}`);
    },
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/admin/comments/${id}`, { method: 'DELETE' }),
    setStatus: (id: string, status: string) =>
      apiFetch<{ id: string; status: string }>(`/api/v1/admin/comments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  reports: {
    list: (resolved?: boolean) => {
      const q = new URLSearchParams();
      if (resolved !== undefined) q.set('resolved', String(resolved));
      const qs = q.toString();
      return apiFetch<Report[]>(`/api/v1/admin/reports${qs ? `?${qs}` : ''}`);
    },
    resolve: (id: string) =>
      apiFetch<{ id: string; resolved: boolean }>(`/api/v1/admin/reports/${id}/resolve`, { method: 'PUT' }),
  },
};
