'use client'

import { Stage, Layer, Line, Text, Circle, Rect, Arrow, Group, Image as KonvaImage, Transformer } from 'react-konva';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/custom/button';
import { 
  FaPen, FaEraser, FaFont, FaTrash, FaPlus, FaArrowLeft, FaArrowRight, 
  FaUndo, FaRedo, FaMinus, FaShapes, FaMousePointer, FaSquare, FaCircle,
  FaLongArrowAltRight, FaHighlighter, FaPalette, FaExpand, FaCompress,
  FaDownload, FaBars, FaTimes, FaShare, FaBold, FaItalic, FaAlignRight,
  FaAlignCenter, FaAlignLeft, FaUnderline, FaPencilAlt, FaStickyNote,
  FaCopy, FaEye, FaHandPaper, FaBullseye, FaUsers, FaRegSquare, FaRegCircle,
  FaRegStar, FaRegGem, FaRegArrowAltCircleRight, FaRegSun, FaRegMoon,
  FaRegFilePdf, FaRegFileImage, FaLayerGroup
} from 'react-icons/fa';
import { FiPlus, FiMinus, FiMaximize, FiMinimize, FiGrid } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import SharingPanel from '@/components/SharingPanel';
import { useSession } from 'next-auth/react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useToast } from '@/hooks/useToast';

// ============================================================================
// TYPES
// ============================================================================

type KonvaMouseEvent = KonvaEventObject<MouseEvent>;
type KonvaTouchEvent = KonvaEventObject<TouchEvent>;
type KonvaWheelEvent = KonvaEventObject<WheelEvent>;

interface LineData {
  points: number[];
  tool: 'pen' | 'pencil' | 'highlighter' | 'eraser';
  color: string;
  size: number;
  opacity: number;
}

type ShapeType = 'rectangle' | 'circle' | 'diamond' | 'triangle' | 'arrow' | 'line' | 'star';

interface ShapeData {
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
}

interface TextBoxData {
  x: number;
  y: number;
  text: string;
  id: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  underline: boolean;
  width: number;
}

interface StickyNoteData {
  x: number;
  y: number;
  text: string;
  id: string;
  color: string;
  width: number;
  height: number;
}

interface HistoryItem {
  lines: LineData[][];
  textBoxes: TextBoxData[][];
  shapes: ShapeData[][];
  stickyNotes: StickyNoteData[][];
}

type ToolMode = 'select' | 'hand' | 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'text' | 'shape' | 'sticky';

type Theme = 'light' | 'dark';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc',
  '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#ff0000', '#ff6b6b', '#ffa94d', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6'
];

const STICKY_COLORS = [
  '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b',
  '#fce4ec', '#f8bbd0', '#f48fb1', '#f06292', '#ec407a',
  '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5',
  '#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a'
];

const FONTS = ['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Verdana', 'Georgia', 'Comic Sans MS'];

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

const MemoizedLine = memo(({ line }: { line: LineData }) => (
  <Line
    points={line.points}
    stroke={line.color}
    strokeWidth={line.size}
    opacity={line.opacity}
    tension={0.5}
    lineCap="round"
    lineJoin="round"
    globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
  />
));
MemoizedLine.displayName = 'MemoizedLine';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CanvasBoard({ noteId, isReadOnly = false }: { noteId: string; isReadOnly?: boolean }) {
  const storageKey = `canvas-${noteId}`;
  const { data: session } = useSession();
  const toast = useToast();

  // Theme
  const [theme, setTheme] = useState<Theme>('light');

  // Canvas state
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Data state
  const [canvasData, setCanvasData] = usePersistentState<{
    lines: LineData[][];
    textBoxes: TextBoxData[][];
    shapes: ShapeData[][];
    stickyNotes: StickyNoteData[][];
    background: string;
  }>(storageKey, {
    lines: [[]],
    textBoxes: [[]],
    shapes: [[]],
    stickyNotes: [[]],
    background: '#ffffff'
  }, noteId);

  const { lines, textBoxes, shapes, stickyNotes, background } = canvasData;

  // UI states
  const [mode, setMode] = useState<ToolMode>('select');
  const [pageIndex, setPageIndex] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Tool states
  const [penSize, setPenSize] = useState(4);
  const [penColor, setPenColor] = useState('#000000');
  const [highlighterOpacity, setHighlighterOpacity] = useState(0.3);
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedFontSize, setSelectedFontSize] = useState(24);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const saveToServer = useRef<NodeJS.Timeout | null>(null);
  const isDrawing = useRef(false);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null); // Add this


  // Selection state
  const [selectedElement, setSelectedElement] = useState<{
    type: 'shape' | 'text' | 'sticky';
    id: string;
  } | null>(null);

  // Other states
  const [cursor, setCursor] = useState('default');
  const [previewShape, setPreviewShape] = useState<ShapeData | null>(null);
  const [textInput, setTextInput] = useState({ active: false, x: 0, y: 0, text: '', id: '' });
  const [stageSize, setStageSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [editingSticky, setEditingSticky] = useState<{ id: string; text: string } | null>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const currentLines = (lines && lines[pageIndex]) || [];
  const currentTextBoxes = (textBoxes && textBoxes[pageIndex]) || [];
  const currentShapes = (shapes && shapes[pageIndex]) || [];
  const currentStickyNotes = (stickyNotes && stickyNotes[pageIndex]) || [];

  const getExportBackground = () => {
      // Always use white background for export to ensure visibility
      return '#ffffff';
    };  

  const getPointerPosition = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  };

  const pushHistory = useCallback(() => {
    if (isReadOnlyMode || isReadOnly) return;
    const newHistory = [...history.slice(0, historyIndex + 1), {
      lines: JSON.parse(JSON.stringify(lines)),
      textBoxes: JSON.parse(JSON.stringify(textBoxes)),
      shapes: JSON.parse(JSON.stringify(shapes)),
      stickyNotes: JSON.parse(JSON.stringify(stickyNotes))
    }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, lines, textBoxes, shapes, stickyNotes, isReadOnlyMode, isReadOnly]);

  // ============================================================================
  // TEXT HANDLER
  // ============================================================================

  const handleTextSave = useCallback(() => {
    if (textInput.text.trim()) {
      pushHistory();
      const newTextBox: TextBoxData = {
        id: Date.now().toString(),
        x: textInput.x,
        y: textInput.y,
        text: textInput.text,
        fontSize: selectedFontSize,
        fontFamily: selectedFont,
        fill: penColor,
        align: textAlign,
        bold: textBold,
        italic: textItalic,
        underline: textUnderline,
        width: 300,
      };
      
      const updated = [...textBoxes];
      updated[pageIndex] = [...currentTextBoxes, newTextBox];
      setCanvasData(prev => ({ ...prev, textBoxes: updated }));
      setRenderTrigger(prev => prev + 1);
      toast.success({ title: "Text added", description: "Text box created" });
    }
    setTextInput({ active: false, x: 0, y: 0, text: '', id: '' });
  }, [textInput, pushHistory, selectedFontSize, selectedFont, penColor, textAlign, textBold, textItalic, textUnderline, textBoxes, pageIndex, currentTextBoxes, setCanvasData, toast]);

  // ============================================================================
  // STICKY NOTE HANDLER
  // ============================================================================

  const handleStickyEdit = useCallback(() => {
    if (!editingSticky) return;
    
    pushHistory();
    const updated = [...stickyNotes];
    updated[pageIndex] = currentStickyNotes.map(s =>
      s.id === editingSticky.id ? { ...s, text: editingSticky.text } : s
    );
    setCanvasData(prev => ({ ...prev, stickyNotes: updated }));
    setEditingSticky(null);
    setRenderTrigger(prev => prev + 1);
    toast.success({ title: "Sticky note updated" });
  }, [editingSticky, pushHistory, stickyNotes, pageIndex, currentStickyNotes, setCanvasData, toast]);

  // ============================================================================
  // DELETE STICKY NOTE
  // ============================================================================

  const deleteStickyNote = useCallback((stickyId: string) => {
    if (isReadOnlyMode || isReadOnly) return;
    
    pushHistory();
    const updated = [...stickyNotes];
    updated[pageIndex] = currentStickyNotes.filter(s => s.id !== stickyId);
    setCanvasData(prev => ({ ...prev, stickyNotes: updated }));
    setRenderTrigger(prev => prev + 1);
    setSelectedElement(null);
    toast.success({ title: "Sticky note deleted" });
  }, [isReadOnlyMode, isReadOnly, pushHistory, stickyNotes, pageIndex, currentStickyNotes, setCanvasData, toast]);

  // ============================================================================
  // SYNC FUNCTIONS
  // ============================================================================

  const syncToServer = useCallback(() => {
    if (!session?.user?.id) return;
    if (isReadOnlyMode || isReadOnly) return;

    if (saveToServer.current) clearTimeout(saveToServer.current);

    setSaveStatus('saving');

    saveToServer.current = setTimeout(async () => {
      try {
        const canvasDataToSave = {
          lines: lines || [[]],
          textBoxes: textBoxes || [[]],
          shapes: shapes || [[]],
          stickyNotes: stickyNotes || [[]],
          background: background || '#ffffff'
        };

        const response = await fetch(`/api/notes/${noteId}/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "canvas",
            userId: session.user.id,
            updatedAt: new Date().toISOString(),
            data: canvasDataToSave
          })
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        setSaveStatus('saved');
      } catch (err) {
        console.error("Canvas SYNC FAILED", err);
        setSaveStatus('error');
        toast.error({
          title: "Failed to save canvas",
          description: err instanceof Error ? err.message : "Please try again"
        });
      }
    }, 700);
  }, [session, noteId, lines, textBoxes, shapes, stickyNotes, background, isReadOnlyMode, isReadOnly, toast]);

  // ============================================================================
  // LOAD CONTENT
  // ============================================================================

  useEffect(() => {
    if (!noteId) return;

    const loadFromServer = async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}/content`);
        if (!res.ok) {
          console.error("Failed to load canvas");
          return;
        }

        const json = await res.json();

        if (json.readOnly || json.isImported || json.permission === 'view') {
          setIsReadOnlyMode(true);
        }

        if (json?.type === "canvas" && json?.data) {
          setCanvasData({
            lines: json.data.lines || [[]],
            textBoxes: json.data.textBoxes || [[]],
            shapes: json.data.shapes || [[]],
            stickyNotes: json.data.stickyNotes || [[]],
            background: json.data.background || '#ffffff'
          });
          setRenderTrigger(prev => prev + 1);
        }
      } catch (err) {
        console.error("LOAD CANVAS FAILED", err);
      } finally {
        setLoading(false);
      }
    };

    loadFromServer();
  }, [noteId]);

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================

  useEffect(() => {
    if (!loading && !isReadOnlyMode && !isReadOnly) {
      syncToServer();
    }
  }, [lines, textBoxes, shapes, stickyNotes, background, loading, isReadOnlyMode, isReadOnly, syncToServer]);

  useEffect(() => {
    if (!loading && !isReadOnlyMode && !isReadOnly && history.length === 0) {
      pushHistory();
    }
  }, [loading, pushHistory, isReadOnlyMode, isReadOnly, history.length]);

  useEffect(() => {
  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };
}, []);

  // ============================================================================
  // HISTORY FUNCTIONS
  // ============================================================================

  const undo = useCallback(() => {
    if (isReadOnlyMode || isReadOnly) return;
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setCanvasData(prev => ({
        ...prev,
        lines: prevState.lines,
        textBoxes: prevState.textBoxes,
        shapes: prevState.shapes,
        stickyNotes: prevState.stickyNotes
      }));
      setHistoryIndex(historyIndex - 1);
      setRenderTrigger(prev => prev + 1);
      toast.info({ title: "Undo", description: "Reverted to previous state" });
    }
  }, [historyIndex, history, isReadOnlyMode, isReadOnly, setCanvasData, toast]);

  const redo = useCallback(() => {
    if (isReadOnlyMode || isReadOnly) return;
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCanvasData(prev => ({
        ...prev,
        lines: nextState.lines,
        textBoxes: nextState.textBoxes,
        shapes: nextState.shapes,
        stickyNotes: nextState.stickyNotes
      }));
      setHistoryIndex(historyIndex + 1);
      setRenderTrigger(prev => prev + 1);
      toast.info({ title: "Redo", description: "Redone previous action" });
    }
  }, [historyIndex, history, isReadOnlyMode, isReadOnly, setCanvasData, toast]);

  // ============================================================================
  // CURSOR
  // ============================================================================

  useEffect(() => {
    if (isReadOnlyMode || isReadOnly) {
      setCursor('default');
      return;
    }
    switch (mode) {
      case 'select': setCursor('default'); break;
      case 'hand': setCursor('grab'); break;
      case 'pen':
      case 'pencil':
      case 'highlighter':
        setCursor('crosshair');
        break;
      case 'eraser':
        setCursor('crosshair');
        break;
      case 'text': setCursor('text'); break;
      case 'shape': setCursor('crosshair'); break;
      case 'sticky': setCursor('pointer'); break;
    }
  }, [mode, isReadOnlyMode, isReadOnly]);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z': e.preventDefault(); undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 's': e.preventDefault(); syncToServer(); break;
          case 'Delete':
           {
            if (selectedElement) {
              e.preventDefault();
              if (selectedElement.type === 'sticky') {
                deleteStickyNote(selectedElement.id);
              }
            }
            break;
          }
        }
      } else {
        switch (e.key) {
          case ' ': e.preventDefault(); setMode('hand'); break;
          case 't': setMode('text'); break;
          case 'p': setMode('pen'); break;
          case 'r': setMode('shape'); break;
          case 'e': setMode('eraser'); break;
          case 'h': setMode('hand'); break;
          case 's': setMode('select'); break;
          case 'Escape': setSelectedElement(null); break;
          case 'Delete':
           {
            if (selectedElement && selectedElement.type === 'sticky') {
              deleteStickyNote(selectedElement.id);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, syncToServer, selectedElement, deleteStickyNote]);

  // ============================================================================
  // TOUCH / MOUSE HANDLERS
  // ============================================================================

  const handleMouseDown = (e: KonvaMouseEvent) => {
    if (isReadOnlyMode || isReadOnly) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getPointerPosition(stage);
    if (!pos) return;

    if (mode === 'hand') {
      stage.draggable(true);
      return;
    }

    if (mode === 'select') {
      if (e.target === stage) {
        setSelectedElement(null);
        stage.draggable(false);
      }
      return;
    }

    if (mode === 'text') {
      setTextInput({ active: true, x: pos.x, y: pos.y, text: '', id: Date.now().toString() });
      return;
    }

    if (mode === 'pen' || mode === 'pencil' || mode === 'highlighter' || mode === 'eraser') {
      pushHistory();
      isDrawing.current = true;
      const newLine: LineData = {
        points: [pos.x, pos.y],
        tool: mode === 'pencil' ? 'pencil' : mode === 'highlighter' ? 'highlighter' : mode === 'eraser' ? 'eraser' : 'pen',
        color: mode === 'eraser' ? '#ffffff' : penColor,
        size: penSize,
        opacity: mode === 'highlighter' ? highlighterOpacity : 1
      };
      const updated = [...lines];
      updated[pageIndex] = [...currentLines, newLine];
      setCanvasData(prev => ({ ...prev, lines: updated }));
      setRenderTrigger(prev => prev + 1);
    } else if (mode === 'shape') {
      shapeStart.current = { x: pos.x, y: pos.y };
    } else if (mode === 'sticky') {
      pushHistory();
      const newSticky: StickyNoteData = {
        x: pos.x,
        y: pos.y,
        text: '',
        id: Date.now().toString(),
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
        width: 200,
        height: 150
      };
      const updated = [...stickyNotes];
      updated[pageIndex] = [...currentStickyNotes, newSticky];
      setCanvasData(prev => ({ ...prev, stickyNotes: updated }));
      setRenderTrigger(prev => prev + 1);
      toast.info({ title: "Sticky note created", description: "Double-click to edit" });
    }
  };

  const handleMouseMove = (e: KonvaMouseEvent) => {
  if (isReadOnlyMode || isReadOnly) return;
  if (!isDrawing.current && mode !== 'shape') return;

  const stage = e.target.getStage();
  if (!stage) return;
  const pos = getPointerPosition(stage);
  if (!pos) return;

  if (isDrawing.current && (mode === 'pen' || mode === 'pencil' || mode === 'highlighter' || mode === 'eraser')) {
    // Throttle updates using requestAnimationFrame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const updated = [...lines];
      const current = [...currentLines];
      if (current.length === 0) return;
      const lastLine = { ...current[current.length - 1] };
      lastLine.points = [...lastLine.points, pos.x, pos.y];
      current[current.length - 1] = lastLine;
      updated[pageIndex] = current;
      setCanvasData(prev => ({ ...prev, lines: updated }));
    });
  } else if (mode === 'shape' && shapeStart.current) {
    const start = shapeStart.current;
    const x = Math.min(start.x, pos.x);
    const y = Math.min(start.y, pos.y);
    const width = Math.abs(pos.x - start.x);
    const height = Math.abs(pos.y - start.y);

    setPreviewShape({
      type: selectedShape,
      x,
      y,
      width: Math.max(width, 1),
      height: Math.max(height, 1),
      id: 'preview',
      fill: 'rgba(0,0,0,0.1)',
      stroke: penColor,
      strokeWidth: 2,
      rotation: 0
    });
  }
};

// Helper function to update drawing
const updateDrawing = (pos: { x: number; y: number }) => {
  const updated = [...lines];
  const current = [...currentLines];
  if (current.length === 0) return;
  const lastLine = { ...current[current.length - 1] };
  lastLine.points = [...lastLine.points, pos.x, pos.y];
  current[current.length - 1] = lastLine;
  updated[pageIndex] = current;
  setCanvasData(prev => ({ ...prev, lines: updated }));
};

  const handleMouseUp = () => {
    if (isReadOnlyMode || isReadOnly) return;
    isDrawing.current = false;

    if (mode === 'hand' && stageRef.current) {
      stageRef.current.draggable(false);
    }

    if (mode === 'shape' && shapeStart.current && previewShape) {
      pushHistory();
      const newShape: ShapeData = {
        ...previewShape,
        id: Date.now().toString(),
        fill: 'rgba(0,0,0,0)'
      };
      const updated = [...shapes];
      updated[pageIndex] = [...currentShapes, newShape];
      setCanvasData(prev => ({ ...prev, shapes: updated }));
      shapeStart.current = null;
      setPreviewShape(null);
      setRenderTrigger(prev => prev + 1);
    }
  };

  const handleWheel = (e: KonvaWheelEvent) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;

    if (isCtrlPressed) {
      const scaleBy = 1.1;
      const oldScale = scale;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      newScale = Math.max(0.05, Math.min(10, newScale));

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setScale(newScale);
      setStagePos(newPos);
    } else {
      setStagePos(prev => ({
        x: prev.x - e.evt.deltaX,
        y: prev.y - e.evt.deltaY,
      }));
    }
  };

  // Touch handlers
  const handleTouchStart = (e: KonvaTouchEvent) => {
    e.evt.preventDefault();
    handleMouseDown(e as unknown as KonvaMouseEvent);
  };

  const handleTouchMove = (e: KonvaTouchEvent) => {
    e.evt.preventDefault();
    handleMouseMove(e as unknown as KonvaMouseEvent);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // ============================================================================
  // PAGE FUNCTIONS
  // ============================================================================

  const addPage = () => {
    if (isReadOnlyMode || isReadOnly) return;
    pushHistory();
    setCanvasData(prev => ({
      ...prev,
      lines: [...lines, []],
      textBoxes: [...textBoxes, []],
      shapes: [...shapes, []],
      stickyNotes: [...stickyNotes, []]
    }));
    setPageIndex(lines.length);
    setRenderTrigger(prev => prev + 1);
  };

  const deletePage = (index: number) => {
    if (isReadOnlyMode || isReadOnly || lines.length <= 1) return;
    pushHistory();
    const newLines = [...lines];
    const newTextBoxes = [...textBoxes];
    const newShapes = [...shapes];
    const newStickyNotes = [...stickyNotes];

    newLines.splice(index, 1);
    newTextBoxes.splice(index, 1);
    newShapes.splice(index, 1);
    newStickyNotes.splice(index, 1);

    setCanvasData(prev => ({
      ...prev,
      lines: newLines,
      textBoxes: newTextBoxes,
      shapes: newShapes,
      stickyNotes: newStickyNotes
    }));
    setPageIndex(Math.min(index, newLines.length - 1));
    setRenderTrigger(prev => prev + 1);
  };

  const duplicatePage = (index: number) => {
    if (isReadOnlyMode || isReadOnly) return;
    pushHistory();
    const newLines = [...lines];
    const newTextBoxes = [...textBoxes];
    const newShapes = [...shapes];
    const newStickyNotes = [...stickyNotes];

    newLines.splice(index + 1, 0, JSON.parse(JSON.stringify(lines[index])));
    newTextBoxes.splice(index + 1, 0, JSON.parse(JSON.stringify(textBoxes[index])));
    newShapes.splice(index + 1, 0, JSON.parse(JSON.stringify(shapes[index])));
    newStickyNotes.splice(index + 1, 0, JSON.parse(JSON.stringify(stickyNotes[index])));

    setCanvasData(prev => ({
      ...prev,
      lines: newLines,
      textBoxes: newTextBoxes,
      shapes: newShapes,
      stickyNotes: newStickyNotes
    }));
    setPageIndex(index + 1);
    setRenderTrigger(prev => prev + 1);
  };

  // ============================================================================
  // EXPORT FUNCTIONS - FIXED
  // ============================================================================

  const exportCanvas = async (format: 'png' | 'jpg' | 'pdf') => {
  console.log('Exporting PDF...');
  
  const stage = stageRef.current;
  if (!stage) {
    toast.error({ title: "Export failed", description: "Canvas not ready" });
    return;
  }

  setIsExporting(true);

  try {
    // Import jsPDF differently to avoid build issues
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
    
    if (!jsPDF) {
      throw new Error('jsPDF library not loaded properly');
    }
    
    // Get all pages
    const totalPages = lines.length;
    const currentPage = pageIndex;
    
    // Create PDF with first page size
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [stageSize.width, stageSize.height]
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Collect data URLs for all pages
    const pageDataUrls: string[] = [];
    
    // Save current state
    const originalScale = scale;
    const originalPos = { ...stagePos };
    const originalBg = background;
    
    // Set white background for export
    setCanvasData(prev => ({ ...prev, background: '#ffffff' }));
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Reset view to show full page
    setScale(1);
    setStagePos({ x: 0, y: 0 });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    for (let i = 0; i < totalPages; i++) {
      // Switch to page
      setPageIndex(i);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Capture the page with white background
      const pageData = stage.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2
      });
      pageDataUrls.push(pageData);
    }

    // Restore original view
    setPageIndex(currentPage);
    setScale(originalScale);
    setStagePos(originalPos);
    setCanvasData(prev => ({ ...prev, background: originalBg }));
    await new Promise(resolve => setTimeout(resolve, 200));

    // Add all pages to PDF
    for (let i = 0; i < pageDataUrls.length; i++) {
      if (i > 0) {
        pdf.addPage([pdfWidth, pdfHeight]);
      }
      pdf.addImage(pageDataUrls[i], 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(`canvas-${noteId}-${Date.now()}.pdf`);
    toast.success({ 
      title: `PDF exported successfully!`, 
      description: `${totalPages} page${totalPages > 1 ? 's' : ''} exported` 
    });
  } catch (error) {
    console.error('Export failed:', error);
    toast.error({ 
      title: "Export failed", 
      description: error instanceof Error ? error.message : "Please try again" 
    });
  } finally {
    setIsExporting(false);
  }
};

  // ============================================================================
  // FULLSCREEN
  // ============================================================================

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGrid = () => {
    if (!showGrid) return null;
    const gridSize = 20;
    const gridLines = [];
    const width = stageSize.width;
    const height = stageSize.height;

    for (let i = 0; i <= width / gridSize; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
          opacity={0.3}
        />
      );
    }
    for (let i = 0; i <= height / gridSize; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
          opacity={0.3}
        />
      );
    }
    return gridLines;
  };

  const renderStickyNote = (sticky: StickyNoteData) => {
  const isPlaceholder = sticky.text === '';
  const isSelected = selectedElement?.type === 'sticky' && selectedElement.id === sticky.id;
  
  return (
    <Group
      key={sticky.id}
      x={sticky.x}
      y={sticky.y}
      draggable={mode === 'select' && !isReadOnlyMode && !isReadOnly}
      onClick={() => {
        if (mode === 'select') {
          setSelectedElement({ type: 'sticky', id: sticky.id });
        }
      }}
      onDblClick={() => {
        if (finalReadOnly) return;
        setEditingSticky({ id: sticky.id, text: sticky.text });
      }}
      onDragEnd={(e) => {
        if (isReadOnlyMode || isReadOnly) return;
        const updated = [...stickyNotes];
        updated[pageIndex] = currentStickyNotes.map(s =>
          s.id === sticky.id ? { ...s, x: e.target.x(), y: e.target.y() } : s
        );
        setCanvasData(prev => ({ ...prev, stickyNotes: updated }));
      }}
    >
      <Rect
        width={sticky.width}
        height={sticky.height}
        fill={sticky.color}
        cornerRadius={6}
        shadowColor="rgba(0,0,0,0.15)"
        shadowBlur={8}
        shadowOffsetX={2}
        shadowOffsetY={4}
        stroke={isSelected ? '#3b82f6' : undefined}
        strokeWidth={isSelected ? 2 : 0}
      />
      <Text
        x={10}
        y={10}
        width={sticky.width - 20}
        height={sticky.height - 20}
        text={isPlaceholder ? 'Double click to edit..' : sticky.text}
        fontSize={isPlaceholder ? 12 : 14}
        fontFamily="Inter"
        fill={isPlaceholder ? '#333' : '#1a1a1a'}
        wrap="word"
        fontStyle={isPlaceholder ? 'italic' : 'normal'}
      />
      
      {/* Delete button - rendered as Konva Text with click handler */}
      {!finalReadOnly && mode === 'select' && isSelected && (
        <Group
          x={sticky.width - 20}
          y={-10}
          onClick={(e) => {
            e.cancelBubble = true;
            deleteStickyNote(sticky.id);
          }}
        >
          <Circle
            x={0}
            y={0}
            radius={12}
            fill="#ef4444"
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={4}
          />
          <Text
            x={-4}
            y={-6}
            text="✕"
            fontSize={14}
            fontFamily="Arial"
            fill="#ffffff"
            fontStyle="bold"
          />
        </Group>
      )}
      
      {/* Pencil icon - always show when in select mode */}
      {!finalReadOnly && mode === 'select' && (
        <Text
          x={sticky.width - 30}
          y={sticky.height - 25}
          text="✏️"
          fontSize={16}
          fontFamily="Inter"
          fill="#666"
          opacity={0.6}
        />
      )}
    </Group>
  );
};

  // ============================================================================
  // TOOL DEFINITIONS
  // ============================================================================

  const tools: { mode: ToolMode; icon: React.ReactNode; label: string; shortcut?: string }[] = [
    { mode: 'select', icon: <FaMousePointer className="w-5 h-5" />, label: 'Select', shortcut: 'S' },
    { mode: 'hand', icon: <FaHandPaper className="w-5 h-5" />, label: 'Hand', shortcut: 'H' },
    { mode: 'pen', icon: <FaPen className="w-5 h-5" />, label: 'Pen', shortcut: 'P' },
    { mode: 'pencil', icon: <FaPencilAlt className="w-5 h-5" />, label: 'Pencil' },
    { mode: 'highlighter', icon: <FaHighlighter className="w-5 h-5" />, label: 'Highlighter' },
    { mode: 'eraser', icon: <FaEraser className="w-5 h-5" />, label: 'Eraser', shortcut: 'E' },
    { mode: 'text', icon: <FaFont className="w-5 h-5" />, label: 'Text', shortcut: 'T' },
    { mode: 'shape', icon: <FaShapes className="w-5 h-5" />, label: 'Shapes', shortcut: 'R' },
    { mode: 'sticky', icon: <FaStickyNote className="w-5 h-5" />, label: 'Sticky' }
  ];

  const shapesList: { type: ShapeType; icon: React.ReactNode; label: string }[] = [
    { type: 'rectangle', icon: <FaSquare className="w-5 h-5" />, label: 'Rectangle' },
    { type: 'circle', icon: <FaCircle className="w-5 h-5" />, label: 'Circle' },
    { type: 'diamond', icon: <FaRegGem className="w-5 h-5" />, label: 'Diamond' },
    { type: 'triangle', icon: <FaRegStar className="w-5 h-5" />, label: 'Triangle' },
    { type: 'arrow', icon: <FaLongArrowAltRight className="w-5 h-5" />, label: 'Arrow' },
    { type: 'line', icon: <FiMinus className="w-5 h-5" />, label: 'Line' },
    { type: 'star', icon: <FaRegStar className="w-5 h-5" />, label: 'Star' }
  ];

  // ============================================================================
  // FINAL READONLY CHECK
  // ============================================================================

  const finalReadOnly = isReadOnly || isReadOnlyMode;

  // ============================================================================
  // WINDOW RESIZE HANDLER
  // ============================================================================

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({
          width: Math.max(320, Math.floor(rect.width)),
          height: Math.max(240, Math.floor(rect.height))
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading canvas...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      {/* ===== READ-ONLY BANNER ===== */}
      {finalReadOnly && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 p-3 text-center">
          <p className="text-blue-700 dark:text-blue-300 text-sm flex items-center justify-center gap-2">
            <FaEye className="w-4 h-4" />
            Read-Only Mode - You cannot edit this content.
          </p>
        </div>
      )}

      {/* ===== TOP NAVIGATION BAR - LARGER ICONS ===== */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)} 
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            {showMobileMenu ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-lg">NV</span>
            </div>
            <div>
              <h1 className="font-semibold text-base text-gray-800 dark:text-gray-200">NoteVerse Canvas</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Infinite Whiteboard</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-4">
            <button 
              onClick={undo} 
              disabled={historyIndex <= 0 || finalReadOnly || isExporting}
              className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all disabled:opacity-40"
            >
              <FaUndo className="w-5 h-5" />
            </button>
            <button 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1 || finalReadOnly || isExporting}
              className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all disabled:opacity-40"
            >
              <FaRedo className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button 
              onClick={() => setShowGrid(!showGrid)} 
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${showGrid ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center - Save Status */}
        <div className="hidden md:flex items-center gap-2">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm ${
            saveStatus === 'saved' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
            saveStatus === 'saving' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
            'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              saveStatus === 'saved' ? 'bg-green-500' :
              saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : '⚠ Error'}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
            className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all"
          >
            {theme === 'light' ? <FaRegMoon className="w-5 h-5" /> : <FaRegSun className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setShowShare(true)} 
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm font-medium"
          >
            <FaShare className="w-4 h-4" />
            Share
          </button>
          
          {/* EXPORT BUTTON - FIXED */}
          <div className="relative">
            <button 
              onClick={() => exportCanvas('pdf')}
              disabled={isExporting}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-medium disabled:opacity-50"
            >
              <FaDownload className="w-4 h-4" />
              {isExporting ? 'Exporting...' : `Export PDF`}
            </button>
          </div>
        
          <button 
            onClick={toggleFullscreen} 
            className="hidden md:flex h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 items-center justify-center transition-all"
          >
            {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
          </button>
        
          <button 
            onClick={() => setShowToolbar(!showToolbar)} 
            className="hidden md:flex h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 items-center justify-center transition-all"
          >
            {showToolbar ? <FaCompress className="w-5 h-5" /> : <FaExpand className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        {/* ===== LEFT TOOLBAR - LARGER ICONS ===== */}
        {showToolbar && !finalReadOnly && (
          <motion.div 
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            className="hidden md:block w-[88px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 overflow-y-auto shadow-xl z-10"
          >
            <div className="py-4 flex flex-col items-center gap-1.5">
              {/* Tools */}
              {tools.map((tool) => (
                <button
                  key={tool.mode}
                  onClick={() => setMode(tool.mode)}
                  className={`relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 group ${
                    mode === tool.mode 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tool.icon}
                  <span className="text-[9px] mt-0.5 font-medium">{tool.label}</span>
                  {tool.shortcut && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                      {tool.shortcut}
                    </span>
                  )}
                </button>
              ))}

              <div className="w-10 h-px bg-gray-200 dark:bg-gray-700 my-2" />

              {/* Color Picker */}
              <div className="relative">
                <button 
                  className="w-12 h-12 rounded-2xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden hover:scale-105 transition-all"
                  onClick={() => document.getElementById('color-picker')?.click()}
                >
                  <div className="w-full h-full" style={{ backgroundColor: penColor }} />
                </button>
                <input
                  id="color-picker"
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Size Control */}
              <div className="flex flex-col items-center gap-1 mt-2">
                <button 
                  onClick={() => setPenSize(prev => Math.min(20, prev + 1))}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-all"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[24px] text-center">{penSize}</span>
                <button 
                  onClick={() => setPenSize(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-all"
                >
                  <FiMinus className="w-5 h-5" />
                </button>
              </div>

              {/* Colors Grid */}
              <div className="w-12 grid grid-cols-3 gap-1 mt-2">
                {COLORS.slice(0, 9).map((color) => (
                  <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    className={`w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 transition-all hover:scale-110 ${
                      penColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== SHAPE TOOLBAR ===== */}
        {showToolbar && !finalReadOnly && mode === 'shape' && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute left-1/2 -translate-x-1/2 top-20 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-1.5"
          >
            {shapesList.map((shape) => (
              <button
                key={shape.type}
                onClick={() => setSelectedShape(shape.type)}
                className={`p-2.5 rounded-xl transition-all ${
                  selectedShape === shape.type 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
                title={shape.label}
              >
                {shape.icon}
              </button>
            ))}
          </motion.div>
        )}

        {/* ===== CANVAS AREA ===== */}
        <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Stage
            key={renderTrigger}
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              cursor, 
              backgroundColor: background, 
              touchAction: 'none',
              backgroundImage: theme === 'dark' 
                ? 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.03) 1px, transparent 1px)'
                : 'radial-gradient(circle at 20px 20px, rgba(0,0,0,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            <Layer>
              {/* Grid */}
              {renderGrid()}

              {/* Lines */}
              {currentLines.map((line, i) => (
                <MemoizedLine key={`line-${i}`} line={line} />
              ))}

              {/* Shapes */}
              {currentShapes.map((shape, idx) => {
                const commonProps = {
                  x: shape.x,
                  y: shape.y,
                  width: shape.width,
                  height: shape.height,
                  fill: shape.fill,
                  stroke: shape.stroke,
                  strokeWidth: shape.strokeWidth,
                  rotation: shape.rotation,
                  draggable: mode === 'select' && !finalReadOnly,
                  onClick: () => {
                    if (mode === 'select') {
                      setSelectedElement({ type: 'shape', id: shape.id });
                    }
                  },
                  onDragEnd: (e: any) => {
                    if (finalReadOnly) return;
                    const updated = [...shapes];
                    updated[pageIndex] = currentShapes.map(s =>
                      s.id === shape.id ? { ...s, x: e.target.x(), y: e.target.y() } : s
                    );
                    setCanvasData(prev => ({ ...prev, shapes: updated }));
                  }
                };

                switch (shape.type) {
                  case 'rectangle':
                    return <Rect key={`rect-${shape.id || idx}`} {...commonProps} />;
                  case 'circle':
                    return <Circle key={`circle-${shape.id || idx}`} {...commonProps} radius={Math.max(shape.width, shape.height) / 2} />;
                  case 'diamond':
                    return <Rect key={`diamond-${shape.id || idx}`} {...commonProps} transform={`rotate(45, ${shape.x + shape.width/2}, ${shape.y + shape.height/2})`} />;
                  case 'triangle':
                    return <Rect key={`triangle-${shape.id || idx}`} {...commonProps} />;
                  case 'arrow': {
                    const points = [shape.x, shape.y, shape.x + shape.width, shape.y + shape.height];
                    return <Arrow key={`arrow-${shape.id || idx}`} points={points} {...commonProps} />;
                  }
                  case 'line': {
                    const points = [shape.x, shape.y, shape.x + shape.width, shape.y + shape.height];
                    return <Line key={`line-${shape.id || idx}`} points={points} {...commonProps} />;
                  }
                  case 'star':
                    return <Rect key={`star-${shape.id || idx}`} {...commonProps} />;
                  default:
                    return <Rect key={`shape-${shape.id || idx}`} {...commonProps} />;
                }
              })}

              {/* Text Boxes */}
              {currentTextBoxes.map((text, idx) => (
                <Text
                  key={`text-${text.id || idx}`}
                  x={text.x}
                  y={text.y}
                  text={text.text}
                  fontSize={text.fontSize}
                  fontFamily={text.fontFamily}
                  fill={text.fill}
                  align={text.align}
                  fontStyle={`${text.bold ? 'bold' : ''} ${text.italic ? 'italic' : ''}`}
                  textDecoration={text.underline ? 'underline' : ''}
                  width={text.width}
                  draggable={mode === 'select' && !finalReadOnly}
                  onClick={() => {
                    if (mode === 'select') {
                      setSelectedElement({ type: 'text', id: text.id });
                    }
                  }}
                  onDragEnd={(e) => {
                    if (finalReadOnly) return;
                    const updated = [...textBoxes];
                    updated[pageIndex] = currentTextBoxes.map(t =>
                      t.id === text.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                    );
                    setCanvasData(prev => ({ ...prev, textBoxes: updated }));
                  }}
                />
              ))}

              {/* Sticky Notes */}
              {currentStickyNotes.map((sticky) => renderStickyNote(sticky))}

              {/* Preview Shape */}
              {previewShape && !finalReadOnly && (
                <Rect
                  x={previewShape.x}
                  y={previewShape.y}
                  width={previewShape.width}
                  height={previewShape.height}
                  stroke={previewShape.stroke}
                  strokeWidth={previewShape.strokeWidth}
                  dash={[5, 5]}
                  fill="rgba(0,0,0,0.05)"
                />
              )}
            </Layer>
          </Stage>

          {/* ===== ZOOM CONTROLS - LARGER ===== */}
          <div className="absolute bottom-24 right-6 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            <button 
              onClick={() => setScale(prev => Math.max(0.05, prev / 1.2))} 
              className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all"
            >
              <FaMinus className="w-4 h-4" />
            </button>
            <span className="text-sm font-mono min-w-[56px] text-center text-gray-700 dark:text-gray-300 font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={() => setScale(prev => Math.min(10, prev * 1.2))} 
              className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all"
            >
              <FaPlus className="w-4 h-4" />
            </button>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button 
              onClick={() => {
                setScale(1);
                setStagePos({ x: 0, y: 0 });
              }} 
              className="h-10 px-4 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              Reset
            </button>
          </div>

          {/* ===== PAGE NAVIGATOR - MOVED UP ===== */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5">
            <button 
              onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} 
              disabled={pageIndex === 0} 
              className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all disabled:opacity-40"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1.5 px-2">
              {lines.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPageIndex(idx)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all ${
                    idx === pageIndex 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setPageIndex(Math.min(lines.length - 1, pageIndex + 1))} 
              disabled={pageIndex === lines.length - 1} 
              className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all disabled:opacity-40"
            >
              <FaArrowRight className="w-4 h-4" />
            </button>

            <div className="w-px h-7 bg-gray-200 dark:bg-gray-700 mx-1" />

            <button 
              onClick={addPage} 
              disabled={finalReadOnly} 
              className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all disabled:opacity-40"
            >
              <FaPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this page?')) {
                  deletePage(pageIndex);
                }
              }}
              className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-all flex items-center justify-center disabled:opacity-40"
              disabled={lines.length <= 1 || finalReadOnly}
            >
              <FaTrash className="w-4 h-4" />
            </button>
            <button
              onClick={() => duplicatePage(pageIndex)}
              className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all flex items-center justify-center disabled:opacity-40"
              disabled={finalReadOnly}
            >
              <FaCopy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== TEXT INPUT MODAL ===== */}
      {textInput.active && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setTextInput({ active: false, x: 0, y: 0, text: '', id: '' })}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-[420px] shadow-2xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 mb-4">Add Text</h3>
            <textarea
              autoFocus
              value={textInput.text}
              onChange={(e) => setTextInput(prev => ({ ...prev, text: e.target.value }))}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-base"
              rows={4}
              placeholder="Type your text here..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSave();
                }
              }}
            />
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setTextInput({ active: false, x: 0, y: 0, text: '', id: '' })} 
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleTextSave} 
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm font-medium"
              >
                Add Text
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== STICKY EDIT MODAL ===== */}
      {editingSticky && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setEditingSticky(null)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-[420px] shadow-2xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 mb-4">Edit Sticky Note</h3>
            <textarea
              autoFocus
              value={editingSticky.text}
              onChange={(e) => setEditingSticky(prev => prev ? { ...prev, text: e.target.value } : null)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-base"
              rows={5}
              placeholder="Type your note here..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStickyEdit();
                }
              }}
            />
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setEditingSticky(null)} 
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleStickyEdit} 
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm font-medium"
              >
                Save Note
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== SHARE MODAL ===== */}
      {showShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowShare(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 flex items-center gap-3">
                <FaUsers className="w-6 h-6 text-blue-500" />
                Share Canvas
              </h3>
              <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                ✕
              </button>
            </div>
            <SharingPanel noteId={noteId} />
          </motion.div>
        </div>
      )}

      {/* ===== MOBILE MENU ===== */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <motion.div 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-gray-900 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Tools</h3>
              <button onClick={() => setShowMobileMenu(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {tools.map((tool) => (
                <button
                  key={tool.mode}
                  onClick={() => { setMode(tool.mode); setShowMobileMenu(false); }}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                    mode === tool.mode 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl">{tool.icon}</div>
                  <span className="text-xs font-medium">{tool.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}