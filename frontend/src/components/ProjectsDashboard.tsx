import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus, Trash2, Clock, Cpu, LogOut } from 'lucide-react';
import { api, ProjectRecord, User } from '../services/api';
import { CODE_PRESETS } from '../utils/codePresets';

interface ProjectsDashboardProps {
  user: User;
  onOpenProject: (project: ProjectRecord) => void;
  onLogout: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ user, onOpenProject, onLogout }) => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-[#0f172a] px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 font-bold">
            SI
          </div>
          <div>
            <div className="font-bold">My Projects</div>
            <div className="text-xs text-slate-400">{user.name || user.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Your IoT Projects</h1>
            <p className="text-sm text-slate-500">Select a project to open the circuit editor, Arduino IDE, and dashboard.</p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-cyan-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-500">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="mb-4 text-slate-600">No projects yet. Create your first circuit!</p>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onOpenProject(project)}
                className="group relative rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-400 hover:shadow-md"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-cyan-600 group-hover:bg-cyan-50">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800">{project.name}</h3>
                <p className="mt-1 text-xs text-slate-500 capitalize">{project.boardType?.replace('_', ' ') || 'Arduino Uno'}</p>
                {project.updatedAt && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute right-3 top-3 rounded p-1.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
