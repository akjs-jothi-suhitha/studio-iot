import React, { useState } from 'react';
import { Code2, ChevronDown, Sparkles } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ComponentInstance, Wire } from '../types';
import { BoardCodeFiles } from '../utils/boardCodes';
import { getProgrammableBoardIds, getBoardLabel } from '../utils/boardCodes';
import { suggestCodeForBoard } from '../utils/componentCodeSnippets';

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

  const autoCode = () => {
    if (!activeId) return;
    onChangeBoardCodes({
      ...boardCodes,
      files: { ...boardCodes.files, [activeId]: suggestCodeForBoard(activeId, components, wires) },
    });
  };

  if (boardIds.length === 0) return null;

  return (
    <div
      className={`flex shrink-0 flex-col border-l border-[#aeb4bc] bg-[#1e1e1e] transition-all ${
        expanded ? 'w-[min(420px,34vw)] min-w-[300px]' : 'w-10'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#333] bg-[#2d2d2d] px-2 py-1.5">
        {expanded && (
          <>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
              <Code2 className="h-3.5 w-3.5" />
              Code
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={autoCode} disabled={isSimulating} title="Auto-generate code" className="rounded p-1 text-teal-400 hover:bg-[#3c3c3c] disabled:opacity-40">
                <Sparkles className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setFontSize((s) => Math.max(10, s - 1))} className="rounded px-1 text-[10px] text-slate-500 hover:bg-[#3c3c3c]">A−</button>
              <button type="button" onClick={() => setFontSize((s) => Math.min(20, s + 1))} className="rounded px-1 text-[10px] text-slate-500 hover:bg-[#3c3c3c]">A+</button>
            </div>
          </>
        )}
        <button type="button" onClick={() => setExpanded(!expanded)} className="rounded p-1 text-slate-500 hover:bg-[#3c3c3c]">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <Code2 className="h-4 w-4 text-teal-400" />}
        </button>
      </div>

      {expanded && (
        <>
          <div className="flex shrink-0 overflow-x-auto border-b border-[#333] bg-[#252526]">
            {boardIds.map((id) => {
              const comp = components.find((c) => c.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchBoard(id)}
                  className={`shrink-0 border-r border-[#333] px-3 py-1 text-[10px] font-mono ${
                    activeId === id ? 'bg-[#1e1e1e] text-teal-300' : 'text-slate-500 hover:text-slate-300'
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
        </>
      )}
    </div>
  );
};
