import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Sparkles,
  FilePlus,
  Trash2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { api, BoardInfo, PortInfo } from '../services/api';
import { ComponentInstance, Wire } from '../types';
import {
  BoardCodeFiles,
  getProgrammableBoardIds,
  getBoardLabel,
  getSketchTabs,
  getActiveTabName,
  getSketchContent,
  setSketchContent,
  addSketchTab,
  removeSketchTab,
  mainTabName,
} from '../utils/boardCodes';
import { suggestCodeForBoard } from '../utils/componentCodeSnippets';

interface ArduinoIDEPanelProps {
  boardCodes: BoardCodeFiles;
  onChangeBoardCodes: (data: BoardCodeFiles) => void;
  serialLogs: string[];
  onClearSerial: () => void;
  boardType: string;
  onChangeBoardType: (board: string) => void;
  components: ComponentInstance[];
  wires: Wire[];
  isSimulating: boolean;
}

const ONLINE_LIBRARIES = [
  { name: 'DHT sensor library', url: 'https://github.com/adafruit/DHT-sensor-library', id: 'DHT' },
  { name: 'Adafruit Unified Sensor', url: 'https://github.com/adafruit/Adafruit_Sensor', id: 'Adafruit_Sensor' },
  { name: 'PubSubClient (MQTT)', url: 'https://github.com/knolleary/pubsubclient', id: 'PubSubClient' },
  { name: 'Blynk (legacy)', url: 'https://github.com/blynkkk/blynk-library', id: 'Blynk' },
  { name: 'Ultrasonic (HC-SR04)', url: 'https://github.com/Erriez/ErriezArduinoHC_SR04', id: 'Ultrasonic' },
];

const EXTENSIONS = [
  { id: 'serial-plotter', name: 'Serial Plotter', desc: 'Graph numeric Serial output' },
  { id: 'code-format', name: 'Auto Format', desc: 'Format sketch on save (Ctrl+T style)' },
  { id: 'lint-hints', name: 'Lint Hints', desc: 'Inline warnings for common Arduino mistakes' },
];

const BOARD_OPTIONS: BoardInfo[] = [
  { id: 'arduino_uno', name: 'Arduino Uno', fqbn: 'arduino:avr:uno' },
  { id: 'arduino_nano', name: 'Arduino Nano', fqbn: 'arduino:avr:nano' },
  { id: 'arduino_mega', name: 'Arduino Mega 2560', fqbn: 'arduino:avr:mega' },
  { id: 'esp32', name: 'ESP32 Dev Module', fqbn: 'esp32:esp32:esp32' },
];

export const ArduinoIDEPanel: React.FC<ArduinoIDEPanelProps> = ({
  boardCodes,
  onChangeBoardCodes,
  serialLogs,
  onClearSerial,
  boardType,
  onChangeBoardType,
  components,
  wires,
  isSimulating,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'serial'>('serial');
  const [fontSize, setFontSize] = useState(14);
  const [sidebar, setSidebar] = useState<'sketchbook' | 'boards' | 'libraries' | 'extensions' | null>('sketchbook');
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(boardType);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [installedLibraries, setInstalledLibraries] = useState<string[]>(['Wire', 'SPI', 'Servo', 'LiquidCrystal']);
  const [libraryUrl, setLibraryUrl] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [cliStatus, setCliStatus] = useState<{ installed: boolean; version?: string; message?: string } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const programmableBoards = useMemo(
    () => components.filter((c) => getProgrammableBoardIds(components).includes(c.id)),
    [components],
  );

  const activeBoardId = boardCodes.activeBoardId || programmableBoards[0]?.id || null;
  const activeBoardComp = programmableBoards.find((b) => b.id === activeBoardId);
  const activeTabName = activeBoardId ? getActiveTabName(activeBoardId, activeBoardComp, boardCodes) : 'sketch.ino';
  const activeCode = activeBoardId ? getSketchContent(activeBoardId, activeTabName, activeBoardComp, boardCodes) : '';

  const boardName = BOARD_OPTIONS.find((b) => b.id === (activeBoardComp?.type === 'esp32' ? 'esp32' : boardType))?.name || 'Board';
  const activeBoardName = activeBoardComp?.name || 'Sketch';

  const refreshPorts = useCallback(async () => {
    try {
      const list = await api.listPorts();
      setPorts(list);
      const connected = list.find((p) => p.connected);
      if (connected && !selectedPort) setSelectedPort(connected.id);
    } catch {
      setPorts([]);
    }
  }, [selectedPort]);

  useEffect(() => {
    refreshPorts();
    const interval = setInterval(refreshPorts, 8000);
    return () => clearInterval(interval);
  }, [refreshPorts]);

  useEffect(() => {
    api.cliStatus()
      .then(setCliStatus)
      .catch(() => setCliStatus({ installed: false, message: 'Could not reach backend' }));
  }, []);

  useEffect(() => {
    if (activeTab === 'serial' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, activeTab]);

  const appendOutput = (line: string) => {
    setOutputLines((prev) => [...prev.slice(-150), line]);
  };

  const updateActiveCode = (newCode: string) => {
    if (!activeBoardId) return;
    onChangeBoardCodes(setSketchContent(boardCodes, activeBoardId, activeTabName, newCode, activeBoardComp));
  };

  const switchBoard = (boardId: string) => {
    onChangeBoardCodes({ ...boardCodes, activeBoardId: boardId });
  };

  const switchTab = (tab: string) => {
    if (!activeBoardId) return;
    onChangeBoardCodes({ ...boardCodes, activeTab: { ...(boardCodes.activeTab || {}), [activeBoardId]: tab } });
  };

  const handleAddFile = () => {
    if (!activeBoardId) return;
    const n = (Object.keys(boardCodes.extraFiles?.[activeBoardId] || {}).length || 0) + 1;
    onChangeBoardCodes(addSketchTab(boardCodes, activeBoardId, `tab_${n}.ino`));
  };

  const handleDeleteFile = (tab: string) => {
    if (!activeBoardId) return;
    onChangeBoardCodes(removeSketchTab(boardCodes, activeBoardId, tab, activeBoardComp));
  };

  const handleSuggestCode = () => {
    if (!activeBoardId) return;
    const suggested = suggestCodeForBoard(activeBoardId, components, wires);
    onChangeBoardCodes({
      ...boardCodes,
      files: { ...boardCodes.files, [activeBoardId]: suggested },
    });
    appendOutput(`[Sketch] Generated code for components wired to ${activeBoardName}`);
    setActiveTab('output');
  };

  /** Verify = compile ONLY (like Arduino IDE checkmark) */
  const handleVerify = async () => {
    if (isSimulating || !activeCode.trim()) return;
    setCompiling(true);
    setActiveTab('output');
    appendOutput(`[Verify] Compiling sketch for ${boardName}…`);
    try {
      const result = await api.compile(activeCode, activeBoardComp?.type === 'esp32' ? 'esp32' : boardType);
      if (result.success) {
        appendOutput(`[Verify] ✓ Compilation successful.`);
        if (result.message) appendOutput(result.message);
      } else {
        appendOutput(`[Verify] ✗ ${result.error || 'Compilation failed'}`);
      }
    } catch (err) {
      appendOutput(`[Verify] ✗ ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setCompiling(false);
    }
  };

  /** Upload = compile + push to board (like Arduino IDE arrow) */
  const handleUpload = async () => {
    if (isSimulating || !activeCode.trim()) return;
    if (!selectedPort) {
      appendOutput('[Upload] ✗ Select a port first (Board & Port menu).');
      setShowBoardModal(true);
      setActiveTab('output');
      return;
    }

    setUploading(true);
    setActiveTab('output');
    appendOutput(`[Upload] Compiling and uploading to ${selectedPort}…`);
    try {
      const uploadBoard = activeBoardComp?.type === 'esp32' ? 'esp32' : boardType;
      const uploadResult = await api.upload(activeCode, uploadBoard, selectedPort);
      if (uploadResult.success) {
        appendOutput(`[Upload] ✓ ${uploadResult.message || 'Done!'}`);
      } else {
        appendOutput(`[Upload] ✗ ${uploadResult.error || 'Upload failed'}`);
      }
    } catch (err) {
      appendOutput(`[Upload] ✗ ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setUploading(false);
    }
  };

  const filteredBoards = BOARD_OPTIONS.filter((b) =>
    b.name.toLowerCase().includes(boardSearch.toLowerCase()),
  );

  const sketchFileName = activeBoardId
    ? `${activeBoardName.replace(/\s+/g, '_').toLowerCase()}.ino`
    : 'sketch.ino';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#252526] text-slate-200">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#3c3c3c] bg-[#2d2d2d] px-3 py-2">
        <button
          type="button"
          onClick={handleVerify}
          disabled={isSimulating || compiling || !activeCode.trim()}
          title="Verify (Compile only)"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3c3c3c] text-teal-400 transition hover:bg-[#4a4a4a] disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={isSimulating || uploading || !activeCode.trim()}
          title="Upload (Compile & Upload)"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3c3c3c] text-teal-400 transition hover:bg-[#4a4a4a] disabled:opacity-40"
        >
          <Upload className="h-4 w-4" />
        </button>
        <button type="button" title="Debug" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3c3c3c] text-slate-500">
          <Bug className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowBoardModal(true)}
          className="ml-2 flex items-center gap-2 rounded-md border border-[#4a4a4a] bg-[#1e1e1e] px-3 py-1.5 text-sm hover:border-teal-600"
        >
          <Usb className="h-4 w-4 text-teal-400" />
          <span>{boardName}</span>
          <span className="text-xs text-slate-500">{selectedPort || 'No port'}</span>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </button>

        <button
          type="button"
          onClick={handleSuggestCode}
          disabled={isSimulating || !activeBoardId}
          title="Generate code from wired components"
          className="ml-1 flex items-center gap-1 rounded-md border border-[#4a4a4a] px-2 py-1.5 text-xs text-teal-400 hover:bg-[#3c3c3c] disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Auto-code
        </button>

        {cliStatus && (
          <span
            className={`ml-2 hidden rounded-full px-2 py-0.5 text-[10px] font-semibold lg:inline ${
              cliStatus.installed ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'
            }`}
            title={cliStatus.version || cliStatus.message}
          >
            {cliStatus.installed ? 'CLI ready' : 'CLI missing'}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setFontSize((s) => Math.max(10, s - 1))} className="rounded p-1.5 hover:bg-[#3c3c3c]">
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-8 text-center text-xs text-slate-400">{fontSize}</span>
          <button type="button" onClick={() => setFontSize((s) => Math.min(24, s + 1))} className="rounded p-1.5 hover:bg-[#3c3c3c]">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[#3c3c3c] bg-[#333333] py-2">
          {[
            { id: 'sketchbook' as const, icon: FolderOpen },
            { id: 'boards' as const, icon: CpuIcon },
            { id: 'libraries' as const, icon: BookOpen },
            { id: 'extensions' as const, icon: Sparkles },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSidebar(sidebar === id ? null : id)}
              className={`relative flex h-10 w-10 items-center justify-center rounded ${sidebar === id ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}
            >
              {sidebar === id && <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-teal-400" />}
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>

        {sidebar && (
          <div className="w-56 shrink-0 overflow-y-auto border-r border-[#3c3c3c] bg-[#252526] p-3">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {sidebar === 'sketchbook' && 'Sketchbook'}
              {sidebar === 'boards' && 'Boards'}
              {sidebar === 'libraries' && 'Libraries'}
              {sidebar === 'extensions' && 'Extensions'}
            </h3>
            {sidebar === 'sketchbook' &&
              (programmableBoards.length === 0 ? (
                <p className="text-xs text-slate-500">Add an Arduino or ESP32 to the circuit first.</p>
              ) : (
                <>
                  {programmableBoards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => switchBoard(b.id)}
                      className={`mb-1 w-full rounded px-2 py-1.5 text-left text-xs ${
                        activeBoardId === b.id ? 'bg-teal-900/40 text-teal-300' : 'hover:bg-[#2d2d2d]'
                      }`}
                    >
                      {getBoardLabel(b)} — {b.name}
                    </button>
                  ))}
                  {activeBoardId && (
                    <div className="mt-3 border-t border-[#3c3c3c] pt-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Files</span>
                        <button type="button" onClick={handleAddFile} title="Add file" className="rounded p-0.5 text-teal-400 hover:bg-[#3c3c3c]">
                          <FilePlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {getSketchTabs(activeBoardId, activeBoardComp, boardCodes).map((tab) => (
                        <div key={tab} className="group mb-0.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => switchTab(tab)}
                            className={`flex-1 rounded px-2 py-1 text-left text-[10px] font-mono ${
                              activeTabName === tab ? 'bg-[#1e1e1e] text-teal-300' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {tab}
                          </button>
                          {tab !== mainTabName(activeBoardComp) && (
                            <button type="button" onClick={() => handleDeleteFile(tab)} className="rounded p-0.5 text-slate-600 opacity-0 hover:text-red-400 group-hover:opacity-100">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ))}
            {sidebar === 'boards' &&
              BOARD_OPTIONS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { onChangeBoardType(b.id); setSelectedBoard(b.id); }}
                  className={`mb-1 w-full rounded px-2 py-1.5 text-left text-xs ${boardType === b.id ? 'bg-teal-900/40 text-teal-300' : 'hover:bg-[#2d2d2d]'}`}
                >
                  {b.name}
                </button>
              ))}
            {sidebar === 'libraries' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search libraries…"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-xs"
                />
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase text-slate-500">Installed</div>
                  {installedLibraries.filter((l) => l.toLowerCase().includes(librarySearch.toLowerCase())).map((lib) => (
                    <div key={lib} className="mb-1 rounded bg-[#1e1e1e] px-2 py-1 text-[10px] font-mono text-teal-300">{lib}</div>
                  ))}
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase text-slate-500">Import from URL</div>
                  <input
                    type="url"
                    placeholder="https://github.com/…/library.zip"
                    value={libraryUrl}
                    onChange={(e) => setLibraryUrl(e.target.value)}
                    className="mb-1 w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-[10px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!libraryUrl.trim()) return;
                      const name = libraryUrl.split('/').pop()?.replace('.zip', '') || 'CustomLib';
                      if (!installedLibraries.includes(name)) {
                        setInstalledLibraries((prev) => [...prev, name]);
                      }
                      appendOutput(`[Library] Imported ${name} from ${libraryUrl}`);
                      setLibraryUrl('');
                      setActiveTab('output');
                    }}
                    className="w-full rounded bg-teal-800/50 py-1 text-[10px] font-semibold text-teal-300 hover:bg-teal-800"
                  >
                    Import library
                  </button>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase text-slate-500">Popular online</div>
                  {ONLINE_LIBRARIES.filter((l) => l.name.toLowerCase().includes(librarySearch.toLowerCase())).map((lib) => (
                    <button
                      key={lib.id}
                      type="button"
                      onClick={() => {
                        if (!installedLibraries.includes(lib.id)) {
                          setInstalledLibraries((prev) => [...prev, lib.id]);
                        }
                        appendOutput(`[Library] Added ${lib.name} — #include ready for verify`);
                        setActiveTab('output');
                      }}
                      className="mb-1 block w-full rounded border border-[#3c3c3c] px-2 py-1.5 text-left text-[10px] hover:bg-[#2d2d2d]"
                    >
                      <div className="font-semibold text-slate-200">{lib.name}</div>
                      <div className="truncate text-slate-500">{lib.url}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sidebar === 'extensions' && (
              <div className="space-y-2">
                {EXTENSIONS.map((ext) => (
                  <label key={ext.id} className="flex cursor-pointer items-start gap-2 rounded border border-[#3c3c3c] p-2 hover:bg-[#2d2d2d]">
                    <input type="checkbox" defaultChecked={ext.id === 'lint-hints'} className="mt-0.5 accent-teal-500" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{ext.name}</div>
                      <div className="text-[10px] text-slate-500">{ext.desc}</div>
                    </div>
                  </label>
                ))}
                <p className="text-[10px] text-slate-500">Extensions apply to the editor UI. Hardware upload uses arduino-cli on the server.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Per-Arduino file tabs */}
          <div className="flex shrink-0 overflow-x-auto border-b border-[#3c3c3c] bg-[#2d2d2d]">
            {programmableBoards.length === 0 ? (
              <div className="px-4 py-1.5 text-xs text-slate-500">No board in circuit</div>
            ) : (
              activeBoardId &&
              getSketchTabs(activeBoardId, activeBoardComp, boardCodes).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchTab(tab)}
                  className={`shrink-0 border-r border-[#3c3c3c] px-4 py-1.5 text-xs font-mono ${
                    activeTabName === tab ? 'bg-[#1e1e1e] text-teal-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))
            )}
          </div>

          <div className="relative min-h-0 flex-1">
            {activeBoardId ? (
              <Editor
                height="100%"
                language="cpp"
                value={activeCode}
                onChange={(v) => updateActiveCode(v || '')}
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
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Place an Arduino Uno or ESP32 on the circuit to write code.
              </div>
            )}
            {isSimulating && (
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-black/20 pt-4">
                <span className="rounded-full bg-amber-500/90 px-4 py-1 text-xs font-bold text-black">Simulation running — editing locked</span>
              </div>
            )}
          </div>

          <div className="flex h-44 shrink-0 flex-col border-t border-[#3c3c3c] bg-[#1e1e1e]">
            <div className="flex shrink-0 border-b border-[#3c3c3c]">
              <button type="button" onClick={() => setActiveTab('output')} className={`px-4 py-1.5 text-xs font-semibold ${activeTab === 'output' ? 'border-b-2 border-teal-400 text-teal-400' : 'text-slate-500'}`}>Output</button>
              <button type="button" onClick={() => setActiveTab('serial')} className={`px-4 py-1.5 text-xs font-semibold ${activeTab === 'serial' ? 'border-b-2 border-teal-400 text-teal-400' : 'text-slate-500'}`}>Serial Monitor</button>
            </div>
            {activeTab === 'serial' && (
              <div className="flex shrink-0 border-b border-[#3c3c3c] px-3 py-1.5">
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder={`Message (Enter to send to '${boardName}' on '${selectedPort || '…'}')`}
                  className="w-full rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1 text-xs text-green-400 outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && serialInput.trim()) { appendOutput(`[TX] ${serialInput}`); setSerialInput(''); } }}
                />
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs leading-5 text-green-400">
              {activeTab === 'output' ? outputLines.map((line, i) => <div key={i}>{line}</div>) : serialLogs.map((log, i) => <div key={i}>{log}</div>)}
              {activeTab === 'serial' && serialLogs.length === 0 && <div className="italic text-slate-500">Run simulation or upload to see serial output.</div>}
              <div ref={logsEndRef} />
            </div>
            {activeTab === 'serial' && (
              <div className="flex shrink-0 justify-end border-t border-[#3c3c3c] p-1.5">
                <button type="button" onClick={onClearSerial} className="rounded px-3 py-0.5 text-xs text-slate-400 hover:bg-[#3c3c3c]">Clear</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-[#3c3c3c] bg-[#252526] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3c3c3c] px-5 py-3">
              <h2 className="font-semibold text-white">Select Board and Port</h2>
              <button type="button" onClick={() => setShowBoardModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <p className="border-b border-[#3c3c3c] px-5 py-2 text-xs text-slate-400">Verify compiles only. Upload compiles then pushes to the selected port.</p>
            <div className="grid grid-cols-2 divide-x divide-[#3c3c3c]">
              <div className="p-4">
                <div className="mb-2 text-xs font-bold uppercase text-slate-500">Boards</div>
                <input type="text" placeholder="Search" value={boardSearch} onChange={(e) => setBoardSearch(e.target.value)} className="mb-2 w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-sm" />
                {filteredBoards.map((b) => (
                  <button key={b.id} type="button" onClick={() => setSelectedBoard(b.id)} className={`block w-full rounded px-2 py-1.5 text-left text-sm ${selectedBoard === b.id ? 'bg-teal-900/40 text-teal-300' : 'hover:bg-[#2d2d2d]'}`}>{b.name}</button>
                ))}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Ports</span>
                  <button type="button" onClick={refreshPorts} className="text-[10px] text-teal-400">Refresh</button>
                </div>
                {ports.length === 0 ? <div className="py-6 text-center text-xs text-slate-500">NO PORTS DISCOVERED</div> : ports.map((p) => (
                  <button key={p.id} type="button" onClick={() => setSelectedPort(p.id)} className={`block w-full rounded px-2 py-1.5 text-left text-sm ${selectedPort === p.id ? 'bg-teal-900/40 text-teal-300' : 'hover:bg-[#2d2d2d]'}`}>{p.label}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#3c3c3c] px-5 py-3">
              <button type="button" onClick={() => setShowBoardModal(false)} className="rounded border border-[#4a4a4a] px-4 py-1.5 text-sm">Cancel</button>
              <button type="button" onClick={() => { onChangeBoardType(selectedBoard); setShowBoardModal(false); }} className="rounded bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white">OK</button>
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
      <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}
