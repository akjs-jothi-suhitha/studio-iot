const API_BASE = import.meta.env.VITE_API_URL || '';

export interface User {
  id: string;
  email: string;
  name: string;
  token?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  boardType: string;
  circuitJson: string;
  codeText: string;
  widgetsJson: string;
  apiKey?: string;
  notesJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardInfo {
  id: string;
  name: string;
  fqbn: string;
}

export interface PortInfo {
  id: string;
  label: string;
  connected: boolean;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('studioiot_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<User>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email: string, password: string, name: string) =>
    request<User>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),

  listProjects: () => request<ProjectRecord[]>('/api/projects'),

  getProject: (id: string) => request<ProjectRecord>(`/api/projects/${id}`),

  createProject: (payload: Partial<ProjectRecord>) =>
    request<ProjectRecord>('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),

  updateProject: (id: string, payload: Partial<ProjectRecord>) =>
    request<ProjectRecord>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteProject: (id: string) =>
    request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

  compile: (codeText: string, boardType: string) =>
    request<{ success: boolean; message?: string; error?: string; memory?: unknown }>('/api/compile', {
      method: 'POST',
      body: JSON.stringify({ codeText, boardType }),
    }),

  upload: (codeText: string, boardType: string, port: string) =>
    request<{ success: boolean; message?: string; error?: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ codeText, boardType, port }),
    }),

  listBoards: () => request<BoardInfo[]>('/api/boards'),

  listPorts: () => request<PortInfo[]>('/api/ports'),
};
