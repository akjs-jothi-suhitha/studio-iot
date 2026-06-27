import React, { useState } from 'react';
import { Code2, ChevronDown, Sparkles } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ComponentInstance, Wire } from '../types';
import { BoardCodeFiles } from '../utils/boardCodes';
import { getProgrammableBoardIds, getBoardLabel, boardTypeFromComponent } from '../utils/boardCodes';
import { suggestCodeForBoard } from '../utils/componentCodeSnippets';
import { AiAssistant } from './AiAssistant';
import { Bot } from 'lucide-react';

interface CircuitCodePanelProps {
  boardCodes: BoardCodeFiles;
  onChangeBoardCodes: (data: BoardCodeFiles) => void;
  components: ComponentInstance[];
  wires: Wire[];
  isSimulating: boolean;
}

export const CircuitCodePanel: React.FC<CircuitCodePanelProps> = ({
  boardCodes,
  onChangeBoardCodes,
  components,
  wires,
  isSimulating,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [fontSize, setFontSize] = useState(13);
  const [showAi, setShowAi] = useState(false);

  const boardIds = getProgrammableBoardIds(components);
  const activeId = boardCodes.activeBoardId || boardIds[0] || null;
  const activeCode = activeId ? boardCodes.files[activeId] || '' : '';

  const updateCode = (code: string) => {
    if (!activeId) return;
    onChangeBoardCodes({
      ...boardCodes,
      files: { ...boardCodes.files, [activeId]: code },
    });
  };

  const switchBoard = (id: string) => {
    onChangeBoardCodes({ ...boardCodes, activeBoardId: id });
  };

  if (boardIds.length === 0) return null;

  return (
    <div
      className={`flex shrink-0 flex-col border-l border-[#2d2d30] bg-[#1e1e1e] transition-all ${
        expanded ? (showAi ? 'w-[min(700px,50vw)] min-w-[500px]' : 'w-[min(420px,34vw)] min-w-[300px]') : 'w-10'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#2d2d30] bg-[#252526] px-2 py-1.5">
        {expanded && (
          <>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Code2 className="h-3.5 w-3.5 text-cyan-600" />
              Code
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAi(!showAi)}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition ${
                  showAi ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Bot className="h-3 w-3" /> AI Chat
              </button>
              <button type="button" onClick={() => setFontSize((s) => Math.max(10, s - 1))} className="rounded px-1 text-[10px] text-slate-500 hover:bg-slate-100">A−</button>
              <button type="button" onClick={() => setFontSize((s) => Math.min(20, s + 1))} className="rounded px-1 text-[10px] text-slate-500 hover:bg-slate-100">A+</button>
            </div>
          </>
        )}
        <button type="button" onClick={() => setExpanded(!expanded)} className="rounded p-1 text-slate-400 hover:bg-slate-800">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <Code2 className="h-4 w-4 text-cyan-600" />}
        </button>
      </div>

      {expanded && (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 overflow-x-auto border-b border-[#2d2d30] bg-[#252526]">
              {boardIds.map((id) => {
                const comp = components.find((c) => c.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchBoard(id)}
                    className={`shrink-0 border-r border-[#2d2d30] px-3 py-1 text-[10px] font-mono ${
                      activeId === id ? 'bg-[#1e1e1e] text-cyan-300' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    {getBoardLabel(comp)}.ino
                  </button>
                );
              })}
            </div>
            <div className="min-h-0 flex-1">
              <Editor
                height="100%"
                language="cpp"
                value={activeCode}
                onChange={(v) => updateCode(v || '')}
                theme="vs-dark"
                options={{
                  readOnly: isSimulating,
                  minimap: { enabled: false },
                  fontSize,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 8 },
                }}
              />
            </div>
          </div>
          
          {showAi && (
            <AiAssistant
              boardType={activeId ? boardTypeFromComponent(components.find(c => c.id === activeId)?.type || 'arduino_uno') : 'arduino_uno'}
              existingCode={activeCode}
              componentNames={components.map(c => c.name)}
              onApplyCode={updateCode}
              onClose={() => setShowAi(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
