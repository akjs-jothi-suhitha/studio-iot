import React, { useState } from 'react';
import {
  Cpu,
  CircuitBoard,
  Code2,
  LayoutDashboard,
  Wifi,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api, User } from '../services/api';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const FEATURES = [
  { icon: CircuitBoard, title: 'Circuit Studio', desc: 'Drag-and-drop wiring with smart obstacle-aware routes' },
  { icon: Code2, title: 'Code Studio', desc: 'Monaco editor, AI code bot, verify & upload to real boards' },
  { icon: LayoutDashboard, title: 'Cloud Dashboard', desc: 'Blynk-style widgets with live WebSocket telemetry' },
  { icon: Sparkles, title: 'AI Assistant', desc: 'Generate Arduino/ESP sketches from natural language' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('student@iot.edu');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(email, password, name || email.split('@')[0]);
      if (user.token) {
        localStorage.setItem('studioiot_token', user.token);
      }
      localStorage.setItem('studioiot_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0f1a]">
      {/* Landing hero */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/80 via-[#0a0f1a] to-violet-950/60" />
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Studio IoT</h1>
              <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">Circuit · Code · Cloud</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
            Design circuits, write firmware, and monitor devices — all in one studio.
          </h2>
          <p className="mb-10 text-base leading-relaxed text-slate-500">
            Simulate Arduino, ESP32, and ESP8266 projects in the browser. Push code to real hardware and stream live data to your cloud dashboard.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-[#15181e]/5 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">{title}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5 text-emerald-400" /> ESP32 / ESP8266</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Live simulation</span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-300">© 2026 Studio IoT — Smart embedded learning platform</p>
      </div>

      {/* Login panel */}
      <div className="flex w-full shrink-0 items-center justify-center p-6 lg:w-[440px] lg:border-l lg:border-white/10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Studio IoT</span>
            </div>
          </div>

          <h2 className="mb-1 text-xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to access your projects' : 'Start building IoT projects today'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#15181e]/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#15181e]/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#15181e]/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-cyan-400 hover:text-cyan-300"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
