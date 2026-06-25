import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Upload,
  Bug,
  FolderOpen,
  BookOpen,
  Search,
  ChevronDown,
  Minus,
  Plus,
  X,
  Usb,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { api, BoardInfo, PortInfo } from '../services/api';
import { ComponentInstance, Wire } from '../types';

interface ArduinoIDEPanelProps {
  code: string;
  onChangeCode: (code: string) => void;
  serialLogs: string[];
  onClearSerial: () => void;
  boardType: string;
  onChangeBoardType: (board: string) => void;
  components: ComponentInstance[];
  wires: Wire[];
  isSimulating: boolean;
  projectName: string;
  componentNotes: Record<string, string>;
  onUpdateComponentNote: (compId: string, note: string) => void;
  uploadRef?: React.MutableRefObject<(() => void) | null>;
}

const BOARD_OPTIONS: BoardInfo[] = [
  { id: 'arduino_uno', name: 'Arduino Uno', fqbn: 'arduino:avr:uno' },
  { id: 'arduino_nano', name: 'Arduino Nano', fqbn: 'arduino:avr:nano' },
  { id: 'arduino_mega', name: 'Arduino Mega 2560', fqbn: 'arduino:avr:mega' },
  { id: 'esp32', name: 'ESP32 Dev Module', fqbn: 'esp32:esp32:esp32' },
];

export const ArduinoIDEPanel: React.FC<ArduinoIDEPanelProps> = ({
  code,
  onChangeCode,
  serialLogs,
  onClearSerial,
  boardType,
  onChangeBoardType,
  components,
  wires,
  isSimulating,
  projectName,
  componentNotes,
  onUpdateComponentNote,
  uploadRef,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'serial'>('serial');
  const [fontSize, setFontSize] = useState(14);
  const [sidebar, setSidebar] = useState<'sketchbook' | 'boards' | 'libraries' | null>(null);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(boardType);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serialInput, setSerialInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const boardName = BOARD_OPTIONS.find((b) => b.id === boardType)?.name || 'Arduino Uno';
  const hasArduino = components.some((c) => c.type === 'arduino_uno');
  const hasWiresToBoard = wires.some((w) => {
    const fromComp = components.find((c) => c.id === w.fromComponentId);
    const toComp = components.find((c) => c.id === w.toComponentId);
    return fromComp?.type === 'arduino_uno' || toComp?.type === 'arduino_uno';
  });

  const refreshPorts = useCallback(async () => {
    try {
      const list = await api.listPorts();
      setPorts(list);
      const connected = list.find((p) => p.connected);
      if (connected) setSelectedPort(connected.id);
    } catch {
      setPorts([]);
    }
  }, []);

  useEffect(() => {
    refreshPorts();
    const interval = setInterval(refreshPorts, 5000);
    return () => clearInterval(interval);
  }, [refreshPorts]);

  useEffect(() => {
    if (activeTab === 'serial' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, activeTab]);

  const appendOutput = (line: string) => {
    setOutputLines((prev) => [...prev.slice(-100), line]);
  };

  const handleVerify = async () => {
    if (isSimulating) return;
    setCompiling(true);
    setActiveTab('output');
    appendOutput(`[Verify] Compiling sketch for ${boardName}…`);
    try {
      const result = await api.compile(code, boardType);
      if (result.success) {
        appendOutput(`[Verify] ✓ ${result.message || 'Success'}`);
        if (result.memory) {
          appendOutput(`[Verify] Memory: ${JSON.stringify(result.memory)}`);
        }
      } else {
        appendOutput(`[Verify] ✗ ${result.error || 'Compilation failed'}`);
      }
    } catch (err) {
      appendOutput(`[Verify] ✗ ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setCompiling(false);
    }
  };

  const handleUpload = async () => {
    if (isSimulating) return;
    if (!hasArduino) {
      appendOutput('[Upload] ✗ Add an Arduino board to the circuit first.');
      setActiveTab('output');
      return;
    }
    if (!hasWiresToBoard) {
      appendOutput('[Upload] ✗ Connect wires from components to the Arduino board.');
      setActiveTab('output');
      return;
    }
    if (!selectedPort) {
      appendOutput('[Upload] ✗ No board port detected. Connect your Arduino via USB.');
      setShowBoardModal(true);
      setActiveTab('output');
      return;
    }

    setUploading(true);
    setActiveTab('output');
    appendOutput(`[Upload] Compiling and uploading to ${boardName} on ${selectedPort}…`);
    try {
      const compileResult = await api.compile(code, boardType);
      if (!compileResult.success) {
        appendOutput(`[Upload] ✗ Compile failed: ${compileResult.error}`);
        return;
      }
      const uploadResult = await api.upload(code, boardType, selectedPort);
      if (uploadResult.success) {
        appendOutput(`[Upload] ✓ ${uploadResult.message || 'Upload complete!'}`);
      } else {
        appendOutput(`[Upload] ✗ ${uploadResult.error || 'Upload failed'}`);
      }
    } catch (err) {
      appendOutput(`[Upload] ✗ ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (uploadRef) {
      uploadRef.current = handleUpload;
    }
  });

  const filteredBoards = BOARD_OPTIONS.filter((b) =>
    b.name.toLowerCase().includes(boardSearch.toLowerCase()),
  );

  const sketchFileName = `${projectName.replace(/\s+/g, '_').toLowerCase() || 'sketch'}.ino`;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#252526] text-slate-200">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#3c3c3c] bg-[#2d2d2d] px-3 py-2">
        <button
          type="button"
          onClick={handleVerify}
          disabled={isSimulating || compiling}
          title="Verify"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3c3c3c] text-teal-400 transition hover:bg-[#4a4a4a] disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={isSimulating || uploading || !selectedPort}
          title="Upload"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3c3c3c] text-teal-400 transition hover:bg-[#4a4a4a] disabled:opacity-40"
        >
          <Upload className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Debug"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3c3c3c] text-slate-400 transition hover:bg-[#4a4a4a]"
        >
          <Bug className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowBoardModal(true)}
          className="ml-2 flex items-center gap-2 rounded-md border border-[#4a4a4a] bg-[#1e1e1e] px-3 py-1.5 text-sm hover:border-teal-600"
        >
          <Usb className="h-4 w-4 text-teal-400" />
          <span>{boardName}</span>
          {selectedPort && <span className="text-xs text-slate-500">({selectedPort})</span>}
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.max(10, s - 1))}
            className="rounded p-1.5 hover:bg-[#3c3c3c]"
            title="Decrease font size"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-8 text-center text-xs text-slate-400">{fontSize}</span>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.min(24, s + 1))}
            className="rounded p-1.5 hover:bg-[#3c3c3c]"
            title="Increase font size"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left sidebar rail */}
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[#3c3c3c] bg-[#333333] py-2">
          {[
            { id: 'sketchbook' as const, icon: FolderOpen, label: 'Sketchbook' },
            { id: 'boards' as const, icon: CpuIcon, label: 'Boards' },
            { id: 'libraries' as const, icon: BookOpen, label: 'Libraries' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSidebar(sidebar === id ? null : id)}
              title={label}
              className={`relative flex h-10 w-10 items-center justify-center rounded transition ${
                sidebar === id ? 'bg-[#1e1e1e] text-teal-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sidebar === id && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded bg-teal-400" />
              )}
              <Icon className="h-5 w-5" />
            </button>
          ))}
          <button type="button" title="Search" className="mt-auto flex h-10 w-10 items-center justify-center text-slate-400 hover:text-white">
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar panel */}
        {sidebar && (
          <div className="w-64 shrink-0 overflow-y-auto border-r border-[#3c3c3c] bg-[#252526] p-3">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              {sidebar === 'sketchbook' && 'Sketchbook'}
              {sidebar === 'boards' && 'Boards Manager'}
              {sidebar === 'libraries' && 'Library Manager'}
            </h3>
            {sidebar === 'sketchbook' && (
              <div className="rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-teal-400">
                {sketchFileName}
              </div>
            )}
            {sidebar === 'boards' &&
              BOARD_OPTIONS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChangeBoardType(b.id);
                    setSelectedBoard(b.id);
                  }}
                  className={`mb-1 w-full rounded px-3 py-2 text-left text-sm transition ${
                    boardType === b.id ? 'bg-teal-900/40 text-teal-300' : 'hover:bg-[#2d2d2d]'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            {sidebar === 'libraries' && (
              <p className="text-xs text-slate-500">Standard Arduino libraries are included automatically.</p>
            )}
          </div>
        )}

        {/* Editor + notes + bottom panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* File tab */}
          <div className="flex shrink-0 border-b border-[#3c3c3c] bg-[#2d2d2d]">
            <div className="border-r border-[#3c3c3c] bg-[#1e1e1e] px-4 py-1.5 text-xs text-slate-300">
              {sketchFileName}
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <Editor
              height="100%"
              language="cpp"
              value={code}
              onChange={(v) => onChangeCode(v || '')}
              theme="vs-dark"
              options={{
                readOnly: isSimulating,
                minimap: { enabled: false },
                fontSize,
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
            {isSimulating && (
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-black/20 pt-4">
                <span className="rounded-full bg-amber-500/90 px-4 py-1 text-xs font-bold text-black">
                  Simulation running — editing locked
                </span>
              </div>
            )}
          </div>

          {/* Component notes */}
          {components.length > 0 && (
            <div className="max-h-28 shrink-0 overflow-y-auto border-t border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Component Notes</div>
              <div className="space-y-1">
                {components.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <span className="w-32 shrink-0 truncate font-semibold text-teal-400">{c.name}</span>
                    <input
                      type="text"
                      value={componentNotes[c.id] || ''}
                      onChange={(e) => onUpdateComponentNote(c.id, e.target.value)}
                      disabled={isSimulating}
                      placeholder={`Note for ${c.name}…`}
                      className="min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#252526] px-2 py-0.5 text-slate-300 outline-none focus:border-teal-600 disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output / Serial Monitor */}
          <div className="flex h-48 shrink-0 flex-col border-t border-[#3c3c3c] bg-[#1e1e1e]">
            <div className="flex shrink-0 border-b border-[#3c3c3c]">
              <button
                type="button"
                onClick={() => setActiveTab('output')}
                className={`px-4 py-1.5 text-xs font-semibold ${
                  activeTab === 'output' ? 'border-b-2 border-teal-400 text-teal-400' : 'text-slate-500'
                }`}
              >
                Output
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('serial')}
                className={`px-4 py-1.5 text-xs font-semibold ${
                  activeTab === 'serial' ? 'border-b-2 border-teal-400 text-teal-400' : 'text-slate-500'
                }`}
              >
                Serial Monitor
              </button>
            </div>

            {activeTab === 'serial' && (
              <div className="flex shrink-0 border-b border-[#3c3c3c] px-3 py-1.5">
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder={`Message (Enter to send to '${boardName}'${selectedPort ? ` on '${selectedPort}'` : ''})`}
                  className="w-full rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1 text-xs text-green-400 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && serialInput.trim()) {
                      appendOutput(`[Serial TX] ${serialInput}`);
                      setSerialInput('');
                    }
                  }}
                />
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs leading-5 text-green-400">
              {activeTab === 'output'
                ? outputLines.map((line, i) => <div key={i}>{line}</div>)
                : serialLogs.map((log, i) => <div key={i}>{log}</div>)}
              {activeTab === 'serial' && serialLogs.length === 0 && (
                <div className="italic text-slate-500">Start simulation or upload to see serial output.</div>
              )}
              <div ref={logsEndRef} />
            </div>

            {activeTab === 'serial' && (
              <div className="flex shrink-0 justify-end border-t border-[#3c3c3c] p-1.5">
                <button
                  type="button"
                  onClick={onClearSerial}
                  className="rounded px-3 py-0.5 text-xs text-slate-400 hover:bg-[#3c3c3c]"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Board & Port Modal */}
      {showBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-[#3c3c3c] bg-[#252526] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3c3c3c] px-5 py-3">
              <h2 className="font-semibold text-white">Select Other Board and Port</h2>
              <button type="button" onClick={() => setShowBoardModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="border-b border-[#3c3c3c] px-5 py-3 text-xs text-slate-400">
              Select both a Board and a Port to upload. Board only allows compile.
            </p>
            <div className="grid grid-cols-2 gap-0 divide-x divide-[#3c3c3c]">
              <div className="p-4">
                <div className="mb-2 text-xs font-bold uppercase text-slate-500">Boards</div>
                <input
                  type="text"
                  placeholder="Search board"
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                  className="mb-3 w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1.5 text-sm outline-none focus:border-teal-600"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredBoards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBoard(b.id)}
                      className={`block w-full rounded px-3 py-2 text-left text-sm ${
                        selectedBoard === b.id ? 'bg-teal-900/40 text-teal-300' : 'hover:bg-[#2d2d2d]'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="mb-2 text-xs font-bold uppercase text-slate-500">Ports</div>
                {ports.length === 0 ? (
                  <div className="py-8 text-center text-xs uppercase text-slate-500">No ports discovered</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    {ports.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPort(p.id)}
                        className={`block w-full rounded px-3 py-2 text-left text-sm ${
                          selectedPort === p.id ? 'bg-teal-900/40 text-teal-300' : 'hover:bg-[#2d2d2d]'
                        }`}
                      >
                        {p.label} {p.connected && <span className="text-teal-400">●</span>}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={refreshPorts}
                  className="mt-2 text-xs text-teal-400 hover:underline"
                >
                  Refresh ports
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#3c3c3c] px-5 py-3">
              <button
                type="button"
                onClick={() => setShowBoardModal(false)}
                className="rounded border border-[#4a4a4a] px-4 py-1.5 text-sm hover:bg-[#3c3c3c]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeBoardType(selectedBoard);
                  setShowBoardModal(false);
                }}
                className="rounded bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}
