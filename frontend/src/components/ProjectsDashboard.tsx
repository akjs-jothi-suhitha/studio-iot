import React, { useEffect, useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Clock,
  Cpu,
  LogOut,
  CircuitBoard,
  Code2,
  LayoutDashboard,
  Sparkles,
  Search,
} from 'lucide-react';
import { api, ProjectRecord, User } from '../services/api';
import { CODE_PRESETS } from '../utils/codePresets';

interface ProjectsDashboardProps {
  user: User;
  onOpenProject: (project: ProjectRecord) => void;
  onLogout: () => void;
}

const BOARD_LABELS: Record<string, string> = {
  arduino_uno: 'Arduino Uno',
  arduino_nano: 'Arduino Nano',
  esp32: 'ESP32',
  arduino_mega: 'Arduino Mega',
};

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ user, onOpenProject, onLogout }) => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = await api.listProjects();
      setProjects(list);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const blink = CODE_PRESETS.blink;
      const project = await api.createProject({
        name: `Project ${projects.length + 1}`,
        boardType: 'arduino_uno',
        circuitJson: JSON.stringify({
          components: blink.components,
          wires: blink.wires,
          componentNotes: {},
        }),
        codeText: blink.code,
        widgetsJson: JSON.stringify(blink.widgets || []),
        notesJson: '{}',
      });
      onOpenProject(project);
    } catch {
      setCreating(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    if (!confirm('Delete this project?')) return;
    await api.deleteProject(id);
    loadProjects();
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-indigo-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-white shadow-lg">
              SI
            </div>
            <div>
              <div className="font-bold text-slate-900">Studio IoT</div>
              <div className="text-xs text-slate-500">{user.name || user.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Feature strip */}
        <div className="mb-10 grid gap-3 sm:grid-cols-3">
          {[
            { icon: CircuitBoard, label: 'Circuit Studio', color: 'text-cyan-400' },
            { icon: Code2, label: 'Code Studio', color: 'text-emerald-400' },
            { icon: LayoutDashboard, label: 'Cloud Dashboard', color: 'text-violet-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-sm font-semibold text-slate-700">{label}</span>
            </div>
          ))}
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Projects</h1>
            <p className="mt-1 text-sm text-slate-500">
              Open a project to design circuits, write code, and monitor live telemetry.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {projects.length > 0 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading projects…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="mb-2 text-lg font-semibold text-slate-800">
              {search ? 'No matching projects' : 'No projects yet'}
            </p>
            <p className="mb-6 text-sm text-slate-500">
              {search ? 'Try a different search term.' : 'Create your first IoT circuit project.'}
            </p>
            {!search && (
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white hover:bg-cyan-500"
              >
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onOpenProject(project)}
                className="group relative rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition group-hover:bg-cyan-500/20">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900">{project.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {BOARD_LABELS[project.boardType || ''] || project.boardType?.replace(/_/g, ' ') || 'Arduino Uno'}
                </p>
                {project.updatedAt && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                )}
                <div className="mt-3 flex gap-1.5">
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold text-cyan-400">Circuit</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">Code</span>
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-400">Cloud</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute right-3 top-3 rounded p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5" />
          Gemini AI chat is available in Code Studio. Set GEMINI_API_KEY in backend/.env.
        </div>
      </main>
    </div>
  );
};
