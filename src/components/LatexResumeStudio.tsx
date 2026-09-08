import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlertTriangle,
  Bold,
  Check,
  Code2,
  Eye,
  Highlighter,
  Italic,
  Loader2,
  Play,
  Redo2,
  Save,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { compileResumeLatex, ensureResumeLatex, saveResumeLatex } from '../api/resumes';
import { ApiError } from '../api/client';
import { htmlToLatex, latexToHtml } from './latexVisualBridge';

interface LatexResumeStudioProps {
  token: string;
  versionId: string;
  initialLatex: string;
  onSaved?: (latex: string) => void;
}

type EditorMode = 'code' | 'visual';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
        },
      },
    ];
  },
});

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-1.5 rounded-md ${
        active ? 'bg-[#1d1d1f] text-white' : 'text-[#444] hover:bg-[#eee]'
      }`}
    >
      {children}
    </button>
  );
}

export default function LatexResumeStudio({
  token,
  versionId,
  initialLatex,
  onSaved,
}: LatexResumeStudioProps) {
  const [source, setSource] = useState(initialLatex);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [loadingSource, setLoadingSource] = useState(!initialLatex);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const compileAbort = useRef<AbortController | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const syncingRef = useRef(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Edit your resume visually…' }),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: '',
    immediatelyRender: false,
    onUpdate: () => {
      if (syncingRef.current) return;
      setDirty(true);
    },
    editorProps: {
      attributes: {
        class:
          'resume-visual-editor outline-none min-h-full prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  const titleLooksBroken = (latex: string) => {
    const m = latex.match(/\\Huge\s*\\textbf\{([^}]*)\}|\{\\Huge\s*\\textbf\{([^}]*)\}\}/);
    const title = (m?.[1] || m?.[2] || '').toLowerCase();
    return (
      !title ||
      title.includes('@') ||
      title.includes('http') ||
      title.includes('linkedin') ||
      title.includes('github') ||
      /\d{7,}/.test(title)
    );
  };

  const setPdfBlob = useCallback((blob: Blob) => {
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    const url = URL.createObjectURL(blob);
    pdfUrlRef.current = url;
    setPdfUrl(url);
  }, []);

  const compile = useCallback(
    async (latex: string) => {
      compileAbort.current?.abort();
      const controller = new AbortController();
      compileAbort.current = controller;
      setCompiling(true);
      try {
        const blob = await compileResumeLatex(token, versionId, latex, controller.signal);
        if (controller.signal.aborted) return;
        setPdfBlob(blob);
        setCompileError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof ApiError) {
          const detail =
            typeof err.detail === 'string' && err.detail
              ? `\n${err.detail.split('\n').slice(-14).join('\n')}`
              : '';
          setCompileError(`${err.message}${detail}`);
        } else {
          setCompileError('Compile failed');
        }
      } finally {
        if (compileAbort.current === controller) setCompiling(false);
      }
    },
    [token, versionId, setPdfBlob],
  );

  const loadLatex = useCallback(
    (latex: string, shouldCompile = true) => {
      setSource(latex);
      if (editor) {
        syncingRef.current = true;
        editor.commands.setContent(latexToHtml(latex), { emitUpdate: false });
        syncingRef.current = false;
      }
      if (shouldCompile) void compile(latex);
    },
    [editor, compile],
  );

  useEffect(() => {
    let cancelled = false;
    setDirty(false);
    setSavedAt(null);
    setCompileError(null);
    if (initialLatex) {
      setLoadingSource(false);
      window.setTimeout(() => {
        if (cancelled) return;
        if (titleLooksBroken(initialLatex)) {
          setLoadingSource(true);
          ensureResumeLatex(token, versionId, undefined, true)
            .then((res) => {
              if (cancelled) return;
              onSaved?.(res.latex_source);
              loadLatex(res.latex_source);
            })
            .catch(() => {
              if (!cancelled) loadLatex(initialLatex);
            })
            .finally(() => {
              if (!cancelled) setLoadingSource(false);
            });
        } else {
          loadLatex(initialLatex);
        }
      }, 0);
    } else {
      setLoadingSource(true);
      ensureResumeLatex(token, versionId)
        .then((res) => {
          if (cancelled) return;
          onSaved?.(res.latex_source);
          loadLatex(res.latex_source);
        })
        .catch((err) => {
          if (cancelled) return;
          setCompileError(err instanceof ApiError ? err.message : 'Could not load LaTeX source');
        })
        .finally(() => {
          if (!cancelled) setLoadingSource(false);
        });
    }
    return () => {
      cancelled = true;
      compileAbort.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  useEffect(() => {
    if (editor && source && !editor.getText().trim()) {
      syncingRef.current = true;
      editor.commands.setContent(latexToHtml(source), { emitUpdate: false });
      syncingRef.current = false;
    }
  }, [editor, source]);

  useEffect(
    () => () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    },
    [],
  );

  const currentLatex = () => {
    if (mode === 'visual' && editor) return htmlToLatex(editor.getHTML());
    return source;
  };

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    if (next === 'code' && editor) {
      const latex = htmlToLatex(editor.getHTML());
      setSource(latex);
      setDirty(true);
    } else if (next === 'visual' && editor) {
      syncingRef.current = true;
      editor.commands.setContent(latexToHtml(source), { emitUpdate: false });
      syncingRef.current = false;
    }
    setMode(next);
  };

  const recompile = () => {
    const latex = currentLatex();
    if (mode === 'visual') setSource(latex);
    setDirty(true);
    void compile(latex);
  };

  const handleSave = async () => {
    const latex = currentLatex();
    if (!latex.trim() || saving) return;
    setSaving(true);
    try {
      await saveResumeLatex(token, versionId, latex);
      setSource(latex);
      setDirty(false);
      setSavedAt(Date.now());
      onSaved?.(latex);
    } catch (err) {
      setCompileError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const lineCount = source.split('\n').length;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="flex flex-col rounded-[14px] overflow-hidden border border-line bg-[#1e1e1e] h-[520px]">
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-[#252526] border-b border-black/40">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => switchMode('code')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] ${
                mode === 'code' ? 'bg-[#3c3c3c] text-white' : 'text-[#a8a8a8] hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> LaTeX
            </button>
            <button
              type="button"
              onClick={() => switchMode('visual')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] ${
                mode === 'visual' ? 'bg-[#3c3c3c] text-white' : 'text-[#a8a8a8] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Visual
            </button>
            {dirty && <span className="text-[11px] text-[#858585] ml-1">• unsaved</span>}
          </div>
          <div className="flex items-center gap-2">
            {savedAt && !dirty && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#4ec9b0]">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setLoadingSource(true);
                ensureResumeLatex(token, versionId, undefined, true)
                  .then((res) => {
                    onSaved?.(res.latex_source);
                    setDirty(false);
                    loadLatex(res.latex_source);
                  })
                  .catch((err) => {
                    setCompileError(err instanceof ApiError ? err.message : 'Rebuild failed');
                  })
                  .finally(() => setLoadingSource(false));
              }}
              disabled={loadingSource || compiling}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md border border-[#555] text-[#d4d4d4] hover:bg-[#3c3c3c] disabled:opacity-40"
            >
              Rebuild
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loadingSource || !dirty}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md bg-[#0e639c] hover:bg-[#1177bb] text-white disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>

        {loadingSource ? (
          <div className="flex-1 flex items-center justify-center text-[13px] text-[#858585] gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Preparing LaTeX from your resume…
          </div>
        ) : mode === 'code' ? (
          <div className="flex flex-1 min-h-0 relative">
            <div
              ref={gutterRef}
              aria-hidden
              className="shrink-0 w-12 overflow-hidden bg-[#1e1e1e] text-right select-none pt-3 pb-3 pr-2 border-r border-[#2d2d2d]"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="text-[11px] leading-[1.6] font-mono text-[#6e7681]">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={source}
              spellCheck={false}
              onChange={(e) => {
                setSource(e.target.value);
                setDirty(true);
              }}
              onScroll={() => {
                if (gutterRef.current && textareaRef.current) {
                  gutterRef.current.scrollTop = textareaRef.current.scrollTop;
                }
              }}
              className="flex-1 min-w-0 resize-none bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[12px] leading-[1.6] p-3 outline-none caret-white whitespace-pre overflow-auto"
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 bg-[#ececec]">
            {editor && (
              <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-white border-b border-line">
                <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
                  <Undo2 className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
                  <Redo2 className="w-3.5 h-3.5" />
                </ToolbarButton>
                <span className="w-px h-4 bg-line mx-1" />
                <ToolbarButton
                  title="Bold"
                  active={editor.isActive('bold')}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  title="Italic"
                  active={editor.isActive('italic')}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  title="Underline"
                  active={editor.isActive('underline')}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  title="Highlight"
                  active={editor.isActive('highlight')}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#fff3bf' }).run()}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </ToolbarButton>
                <span className="w-px h-4 bg-line mx-1" />
                <select
                  className="text-[11px] border border-line rounded-md px-1.5 py-1 bg-white"
                  title="Font size"
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    editor.chain().focus().setMark('textStyle', { fontSize: v }).run();
                  }}
                >
                  <option value="" disabled>
                    Size
                  </option>
                  <option value="11px">11</option>
                  <option value="12px">12</option>
                  <option value="14px">14</option>
                  <option value="16px">16</option>
                  <option value="20px">20</option>
                  <option value="28px">28</option>
                </select>
                <input
                  type="color"
                  title="Text color"
                  className="w-7 h-7 border border-line rounded-md p-0.5 bg-white"
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                />
                <input
                  type="color"
                  title="Background / highlight"
                  className="w-7 h-7 border border-line rounded-md p-0.5 bg-white"
                  defaultValue="#fff3bf"
                  onChange={(e) =>
                    editor.chain().focus().toggleHighlight({ color: e.target.value }).run()
                  }
                />
                <span className="w-px h-4 bg-line mx-1" />
                <ToolbarButton
                  title="Align left"
                  active={editor.isActive({ textAlign: 'left' })}
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  title="Align center"
                  active={editor.isActive({ textAlign: 'center' })}
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  title="Align right"
                  active={editor.isActive({ textAlign: 'right' })}
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </ToolbarButton>
                <span className="w-px h-4 bg-line mx-1" />
                <ToolbarButton
                  title="Insert table"
                  onClick={() =>
                    editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()
                  }
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </ToolbarButton>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-auto p-4">
              <div className="mx-auto max-w-[680px] min-h-full bg-white shadow-[0_2px_16px_rgba(0,0,0,0.12)] rounded-[2px] px-8 py-7">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col rounded-[14px] overflow-hidden border border-line bg-[#525659] h-[520px]">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surface border-b border-line">
          <p className="text-[13px] font-medium text-ink">Live PDF preview</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
              {compiling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling…
                </>
              ) : compileError ? (
                <span className="inline-flex items-center gap-1 text-[#b00020]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Error
                </span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Up to date
                </>
              )}
            </span>
            <button
              type="button"
              onClick={recompile}
              disabled={compiling || loadingSource}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ink text-white text-[12px] font-medium hover:bg-black disabled:opacity-40"
            >
              {compiling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Recompile
            </button>
          </div>
        </div>

        {compileError ? (
          <div className="flex-1 overflow-auto p-4">
            <p className="text-[13px] font-medium text-[#b00020] mb-2">LaTeX compilation failed</p>
            <pre className="text-[11px] font-mono whitespace-pre-wrap text-[#7a1c1c] bg-[#fff2f2] border border-[#f5c2c2] rounded-[10px] p-3">
              {compileError}
            </pre>
          </div>
        ) : pdfUrl ? (
          <iframe title="Resume PDF preview" src={pdfUrl} className="flex-1 w-full border-0 bg-[#525659]" />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px] text-white/70 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Rendering first preview…
          </div>
        )}
      </div>
    </div>
  );
}
