'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Button } from '@/components/custom/button';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaPlus, 
  FaList, 
  FaFileAlt, 
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaListUl,
  FaListOl,
  FaLink,
  FaImage,
  FaUndo,
  FaRedo,
  FaDownload,
  FaHighlighter,
  FaStrikethrough,
  FaExpand,
  FaCompress,
  FaCopy,
  FaTrash
} from 'react-icons/fa';

interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  highlight: string;
  align: 'left' | 'center' | 'right';
  listType: 'none' | 'bullet' | 'number';
  headingLevel: 0 | 1 | 2 | 3;
}

interface PageContent {
  id: string;
  lines: string[];
  format: TextFormat[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function Notebook({ noteId }: { noteId: string }) {
  const storageKey = `notebook-advanced-${noteId}`;
  const [pageIndex, setPageIndex] = useState(0);
  const [mode, setMode] = useState<'line' | 'full'>('line');
  const [fullscreen, setFullscreen] = useState(false);
  const [textFormat, setTextFormat] = useState<TextFormat>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: 16,
    fontFamily: 'Inter, sans-serif',
    color: '#000000',
    highlight: '#ffffff',
    align: 'left',
    listType: 'none',
    headingLevel: 0
  });

  // Using usePersistentState for auto-sync and persistence
  const [pages, setPages] = usePersistentState<PageContent[]>(storageKey, [{
    id: Date.now().toString(),
    lines: [''],
    format: [textFormat],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }], noteId);

  const lineInputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const fullTextRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<PageContent[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Font options
  const fonts = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' }
  ];

  const currentPage = pages[pageIndex] || { lines: [''], format: [textFormat] };
  const currentLines = currentPage.lines || [''];
  const currentFormats = currentPage.format || [textFormat];

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // History helper
  const pushHistory = useCallback(() => {
    const newHistory = [...history.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(pages))];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, pages]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      pushHistory();
    }
    // depend on history.length and pushHistory to satisfy exhaustive-deps
  }, [history.length, pushHistory]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPages(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPages(history[historyIndex + 1]);
    }
  };

  const applyFormatToLine = (lineIndex: number, format: Partial<TextFormat>) => {
    pushHistory();
    const updatedPages = [...pages];
    const updatedFormats = [...updatedPages[pageIndex].format];
    
    if (!updatedFormats[lineIndex]) {
      updatedFormats[lineIndex] = { ...textFormat };
    }
    
    updatedFormats[lineIndex] = { ...updatedFormats[lineIndex], ...format };
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      format: updatedFormats,
      updatedAt: new Date().toISOString()
    };
    
    setPages(updatedPages);
    setTextFormat(prev => ({ ...prev, ...format }));
  };

  const applyFormatToSelection = (format: Partial<TextFormat>) => {
    if (selectedLineIndex !== null) {
      applyFormatToLine(selectedLineIndex, format);
    } else {
      setTextFormat(prev => ({ ...prev, ...format }));
    }
  };

  const handleLineChange = (lineIndex: number, text: string) => {
    pushHistory();
    const updatedPages = [...pages];
    const updatedLines = [...updatedPages[pageIndex].lines];
    updatedLines[lineIndex] = text;
    
    const updatedFormats = [...updatedPages[pageIndex].format];
    if (!updatedFormats[lineIndex]) {
      updatedFormats[lineIndex] = { ...textFormat };
    }
    
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      lines: updatedLines,
      format: updatedFormats,
      updatedAt: new Date().toISOString(),
      version: updatedPages[pageIndex].version + 1
    };
    
    setPages(updatedPages);
  };

  const addLine = () => {
    pushHistory();
    const updatedPages = [...pages];
    const updatedLines = [...updatedPages[pageIndex].lines, ''];
    const updatedFormats = [...updatedPages[pageIndex].format, { ...textFormat }];
    
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      lines: updatedLines,
      format: updatedFormats,
      updatedAt: new Date().toISOString(),
      version: updatedPages[pageIndex].version + 1
    };
    
    setPages(updatedPages);
    
    setTimeout(() => {
      const lastRef = lineInputRefs.current[updatedLines.length - 1];
      if (lastRef) {
        lastRef.focus();
        setSelectedLineIndex(updatedLines.length - 1);
      }
    }, 50);
  };

  const deleteLine = (index: number) => {
    if (currentLines.length <= 1) return;
    pushHistory();
    const updatedPages = [...pages];
    const updatedLines = [...updatedPages[pageIndex].lines];
    const updatedFormats = [...updatedPages[pageIndex].format];
    
    updatedLines.splice(index, 1);
    updatedFormats.splice(index, 1);
    
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      lines: updatedLines,
      format: updatedFormats,
      updatedAt: new Date().toISOString(),
      version: updatedPages[pageIndex].version + 1
    };
    
    setPages(updatedPages);
    setSelectedLineIndex(null);
  };

  const addPage = () => {
    pushHistory();
    const newPage: PageContent = {
      id: Date.now().toString(),
      lines: [''],
      format: [{ ...textFormat }],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    setPageIndex(updatedPages.length - 1);
  };

  const exportPage = () => {
    const content = currentLines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notebook-page-${pageIndex + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const content = pages[pageIndex]?.lines?.join('\n') || currentLines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).catch(err => console.error('Failed to copy:', err));
    } else {
      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const idx = pages[pageIndex]?.lines?.length ?? currentLines.length;
          handleLineChange(idx, `![Image](${imageUrl})`);
          addLine();
          // Ensure the newly inserted line is visible and focused in Line mode,
          // or focus the full page editor when in Full mode.
          setTimeout(() => {
            if (mode === 'line') {
              setSelectedLineIndex(idx);
              const el = lineInputRefs.current[idx];
              if (el) {
                el.focus();
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } else {
              if (fullTextRef.current) {
                fullTextRef.current.focus();
                // place caret at end
                const val = fullTextRef.current.value;
                fullTextRef.current.selectionStart = fullTextRef.current.selectionEnd = val.length;
                fullTextRef.current.scrollTop = fullTextRef.current.scrollHeight;
              }
            }
          }, 60);
        };
        reader.readAsDataURL(file);
      }
      // cleanup
      if (input.parentNode) input.parentNode.removeChild(input);
    };
    // append to DOM then click to ensure mobile browsers allow the file picker
    document.body.appendChild(input);
    input.click();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    const text = prompt('Enter link text:') || url;
    if (url) {
      const idx = pages[pageIndex]?.lines?.length ?? currentLines.length;
      handleLineChange(idx, `[${text}](${url})`);
      addLine();
      // Focus the inserted content similar to insertImage
      setTimeout(() => {
        if (mode === 'line') {
          setSelectedLineIndex(idx);
          const el = lineInputRefs.current[idx];
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          if (fullTextRef.current) {
            fullTextRef.current.focus();
            const val = fullTextRef.current.value;
            fullTextRef.current.selectionStart = fullTextRef.current.selectionEnd = val.length;
            fullTextRef.current.scrollTop = fullTextRef.current.scrollHeight;
          }
        }
      }, 60);
    }
  };

  // Fixed textarea rendering with proper LTR direction
  const renderLineWithFormat = (line: string, format: TextFormat, index: number) => {
    const textareaStyle: React.CSSProperties = {
      fontFamily: format.fontFamily,
      fontSize: `${format.fontSize}px`,
      color: format.color,
      backgroundColor: format.highlight,
      fontWeight: format.bold ? 'bold' : 'normal',
      fontStyle: format.italic ? 'italic' : 'normal',
      textDecoration: format.underline ? 'underline' : 'none',
      lineHeight: '1.6',
      textAlign: format.align as 'left' | 'center' | 'right',
      resize: 'none',
      overflow: 'hidden',
      minHeight: '40px',
      direction: 'ltr', // Force LTR direction
      unicodeBidi: 'isolate' // Prevent bidirectional text issues
    };

    // Add prefix based on formatting
    let displayText = line;
    let prefix = '';
    
    if (format.headingLevel === 1) prefix = '# ';
    else if (format.headingLevel === 2) prefix = '## ';
    else if (format.headingLevel === 3) prefix = '### ';
    else if (format.listType === 'bullet') prefix = '• ';
    else if (format.listType === 'number') prefix = `${index + 1}. `;
    
    displayText = prefix + line;

    return (
      <div
        key={index}
        className="group relative flex items-start gap-3"
      >
        {/* Line number (hidden on very small screens) */}
        <div className="hidden sm:block w-8 flex-shrink-0 pt-3 text-right">
          <span className="text-xs font-mono text-gray-400 select-none">
            {index + 1}
          </span>
        </div>

        {/* Text area with proper LTR direction */}
        <div className="flex-1 relative">
          <textarea
            ref={(el) => { 
              lineInputRefs.current[index] = el;
              // Auto-resize on mount
              if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }
            }}
            value={displayText}
            onChange={(e) => {
              let newText = e.target.value;
              // Remove prefix if present
              if (prefix && newText.startsWith(prefix)) {
                newText = newText.substring(prefix.length);
              }
              handleLineChange(index, newText);
            }}
            style={textareaStyle}
            className={`w-full bg-transparent border border-transparent focus:border-blue-300 rounded px-3 py-2 outline-none transition-all cursor-text whitespace-pre-wrap ${
              selectedLineIndex === index ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
            }`}
            onFocus={() => setSelectedLineIndex(index)}
            onClick={() => setSelectedLineIndex(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addLine();
              }
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const newText = line.substring(0, start) + '\t' + line.substring(end);
                handleLineChange(index, newText);
                setTimeout(() => {
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 1;
                }, 0);
              }
              if (e.key === 'Backspace' && line === '' && currentLines.length > 1) {
                e.preventDefault();
                deleteLine(index);
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
            dir="ltr" // Force left-to-right direction
            spellCheck={true}
            data-index={index}
          />
          
          {/* Delete button */}
          {selectedLineIndex === index && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteLine(index);
              }}
              className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500"
              title="Delete line"
            >
              <FaTrash className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Render markdown previews for image / link */}
        {line && (() => {
          const imgMatch = line.match(/^!\[[^\]]*\]\(([^)]+)\)/);
          if (imgMatch) {
            const src = imgMatch[1];
            return (
              <div className="mt-2">
                <img src={src} alt="inserted" className="max-w-full rounded shadow-sm" />
              </div>
            );
          }

          const linkMatch = line.match(/^\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            const text = linkMatch[1];
            const href = linkMatch[2];
            return (
              <div className="mt-2">
                <a href={href} className="text-blue-600 underline" target="_blank" rel="noreferrer">{text}</a>
              </div>
            );
          }

          return null;
        })()}
      </div>
    );
  };

  // Full page editor component
  const FullPageEditor = () => {
    const handleFullTextChange = (text: string) => {
      pushHistory();
      const updatedPages = [...pages];
      const lines = text.split('\n');
      
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        lines: lines,
        format: lines.map(() => ({ ...textFormat })),
        updatedAt: new Date().toISOString(),
        version: updatedPages[pageIndex].version + 1
      };
      
      setPages(updatedPages);
    };

    const fullTextStyle: React.CSSProperties = {
      fontFamily: textFormat.fontFamily,
      fontSize: `${textFormat.fontSize}px`,
      color: textFormat.color,
      backgroundColor: textFormat.highlight,
      fontWeight: textFormat.bold ? 'bold' : 'normal',
      fontStyle: textFormat.italic ? 'italic' : 'normal',
      textDecoration: textFormat.underline ? 'underline' : 'none',
      direction: 'ltr',
      unicodeBidi: 'isolate'
    };

    return (
      <div className="max-w-4xl mx-auto px-2 sm:px-6">
        <textarea
          ref={fullTextRef}
          value={currentLines.join('\n')}
          onChange={(e) => handleFullTextChange(e.target.value)}
          style={fullTextStyle}
          className="w-full min-h-[400px] p-6 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed resize-none"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
          dir="ltr"
          spellCheck={true}
          placeholder="Start writing your thoughts here..."
        />
        {/* Full-page preview for rendered markdown (images/links) */}
        <div className="mt-4 space-y-3">
          {currentLines.map((ln, i) => {
            const imgMatch = ln.match(/^!\[[^\]]*\]\(([^)]+)\)/);
            if (imgMatch) {
              return (
                <div key={`img-${i}`}>
                  <img src={imgMatch[1]} alt="inserted" className="max-w-full rounded shadow-sm" />
                </div>
              );
            }
            const linkMatch = ln.match(/^\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
              return (
                <div key={`link-${i}`}>
                  <a href={linkMatch[2]} className="text-blue-600 underline" target="_blank" rel="noreferrer">{linkMatch[1]}</a>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  useEffect(() => {
    document.title = "Note - Notebook";
  }, []);

  return (
    <div className={`h-screen ${fullscreen ? 'p-0' : 'p-4'} bg-gradient-to-br from-gray-50 to-blue-50`}>
      <div className={`${fullscreen ? 'h-screen rounded-none' : 'h-full rounded-2xl shadow-2xl'} bg-white border border-gray-200 overflow-hidden flex flex-col`}>
        
        {/* Top Toolbar */}
        <div className="border-b border-gray-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="text-white text-lg" />
                </div>
                <span className="font-bold text-lg">Notebook</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  className="h-9 w-9 p-0"
                  title="Undo"
                >
                  <FaUndo className="text-base" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  className="h-9 w-9 p-0"
                  title="Redo"
                >
                  <FaRedo className="text-base" />
                </Button>
                
                {/* Online/Offline indicator */}
                <div className={`ml-2 px-3 py-1.5 rounded text-sm font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            {/* Center - Page Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
                  disabled={pageIndex === 0}
                  className="h-7 w-7 p-0"
                >
                  <FaChevronLeft className="text-sm" />
                </Button>
                <span className="text-sm font-medium">
                  Page {pageIndex + 1} of {pages.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                  disabled={pageIndex === pages.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <FaChevronRight className="text-sm" />
                </Button>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2 h-9"
                title="Copy to clipboard"
              >
                <FaCopy className="text-base" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportPage}
                className="gap-2 h-9"
                title="Export as text file"
              >
                <FaDownload className="text-base" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFullscreen(!fullscreen)}
                className="gap-2 h-9"
                title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {fullscreen ? <FaCompress className="text-base" /> : <FaExpand className="text-base" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="border-b border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Font Family */}
            <select
              value={textFormat.fontFamily}
              onChange={(e) => applyFormatToSelection({ fontFamily: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {fonts.map(font => (
                <option key={font.value} value={font.value}>{font.name}</option>
              ))}
            </select>

            {/* Font Size */}
            <select
              value={textFormat.fontSize}
              onChange={(e) => applyFormatToSelection({ fontSize: parseInt(e.target.value) })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Text Formatting */}
            <Button
              variant={textFormat.bold ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ bold: !textFormat.bold })}
              className="h-9 w-9 p-0"
              title="Bold"
            >
              <FaBold className="text-base" />
            </Button>
            <Button
              variant={textFormat.italic ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ italic: !textFormat.italic })}
              className="h-9 w-9 p-0"
              title="Italic"
            >
              <FaItalic className="text-base" />
            </Button>
            <Button
              variant={textFormat.underline ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ underline: !textFormat.underline })}
              className="h-9 w-9 p-0"
              title="Underline"
            >
              <FaUnderline className="text-base" />
            </Button>
            <Button
              variant={textFormat.strikethrough ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ strikethrough: !textFormat.strikethrough })}
              className="h-9 w-9 p-0"
              title="Strikethrough"
            >
              <FaStrikethrough className="text-base" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Text Alignment */}
            <Button
              variant={textFormat.align === 'left' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ align: 'left' })}
              className="h-9 w-9 p-0"
              title="Align Left"
            >
              <FaAlignLeft className="text-base" />
            </Button>
            <Button
              variant={textFormat.align === 'center' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ align: 'center' })}
              className="h-9 w-9 p-0"
              title="Align Center"
            >
              <FaAlignCenter className="text-base" />
            </Button>
            <Button
              variant={textFormat.align === 'right' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ align: 'right' })}
              className="h-9 w-9 p-0"
              title="Align Right"
            >
              <FaAlignRight className="text-base" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Lists */}
            <Button
              variant={textFormat.listType === 'bullet' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ listType: textFormat.listType === 'bullet' ? 'none' : 'bullet' })}
              className="h-9 w-9 p-0"
              title="Bullet List"
            >
              <FaListUl className="text-base" />
            </Button>
            <Button
              variant={textFormat.listType === 'number' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ listType: textFormat.listType === 'number' ? 'none' : 'number' })}
              className="h-9 w-9 p-0"
              title="Numbered List"
            >
              <FaListOl className="text-base" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Headings */}
            <Button
              variant={textFormat.headingLevel === 1 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ headingLevel: textFormat.headingLevel === 1 ? 0 : 1 })}
              className="h-9 w-9 p-0 font-bold"
              title="Heading 1"
            >
              H1
            </Button>
            <Button
              variant={textFormat.headingLevel === 2 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => applyFormatToSelection({ headingLevel: textFormat.headingLevel === 2 ? 0 : 2 })}
              className="h-9 w-9 p-0 font-bold"
              title="Heading 2"
            >
              H2
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textFormat.color}
                onChange={(e) => applyFormatToSelection({ color: e.target.value })}
                className="w-9 h-9 cursor-pointer rounded border border-gray-300"
                title="Text Color"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyFormatToSelection({ highlight: '#FEF3C7' })}
                className="h-9 w-9 p-0"
                title="Highlight"
              >
                <FaHighlighter className="text-base" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'line' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode('line')}
              className="gap-2 h-9"
            >
              <FaList className="text-base" />
              Line Mode
            </Button>
            <Button
              variant={mode === 'full' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode('full')}
              className="gap-2 h-9"
            >
              <FaFileAlt className="text-base" />
              Full Page
            </Button>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={insertLink}
                className="h-9 w-9 p-0"
                title="Insert Link"
              >
                <FaLink className="text-base" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={insertImage}
                className="h-9 w-9 p-0"
                title="Insert Image"
              >
                <FaImage className="text-base" />
              </Button>
              <Button
                size="sm"
                onClick={addPage}
                className="gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FaPlus className="text-base" />
                New Page
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gradient-to-b from-white to-gray-50">
          {mode === 'line' ? (
            <div className="max-w-4xl mx-auto">
              {currentLines.length > 0 ? (
                <div className="space-y-2">
                  {currentLines.map((line, index) => 
                    renderLineWithFormat(line, currentFormats[index] || textFormat, index)
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <FaFileAlt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No content yet</p>
                  <p className="text-sm mt-1">Start writing by adding a line below</p>
                </div>
              )}
              
              {/* Add Line Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={addLine}
                  variant="outline"
                  className="gap-2 h-10 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                >
                  <FaPlus className="text-base" />
                  Add New Line
                </Button>
              </div>
            </div>
          ) : (
            <FullPageEditor />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-6">
              <span className="font-medium">Lines: {currentLines.length}</span>
              <span className="font-medium">Words: {currentLines.join(' ').split(/\s+/).filter(w => w.length > 0).length}</span>
              <span className="font-medium">Characters: {currentLines.join('').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                {isOnline ? 'Synced' : 'Working offline'} • Version {currentPage.version}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
