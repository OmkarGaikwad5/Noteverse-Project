'use client'
import { Stage, Layer, Line, Text, Circle, Rect, Arrow } from 'react-konva';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/custom/button';
import { 
  FaPen, 
  FaEraser, 
  FaFont, 
  FaTrash, 
  FaPlus, 
  FaArrowLeft, 
  FaArrowRight, 
  FaUndo, 
  FaRedo, 
  FaImage, 
  FaMinus, 
  FaShapes,
  FaMousePointer,
  FaSquare,
  FaCircle,
  FaLongArrowAltRight,
  FaHighlighter,
  FaPalette,
  FaExpand,
  FaCompress,
  FaDownload,
  FaBars,
  FaTimes,
  FaShare,
  FaBold,
  FaItalic,
  FaAlignRight,
  FaAlignCenter,
  FaAlignLeft,
  FaUnderline,
} from 'react-icons/fa';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import SharingPanel from '@/components/SharingPanel';
import { useSession } from 'next-auth/react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useToast } from '@/hooks/useToast';

type KonvaMouseEvent = KonvaEventObject<MouseEvent>;
type KonvaTouchEvent = KonvaEventObject<TouchEvent>;
type KonvaWheelEvent = KonvaEventObject<WheelEvent>;

interface LineData {
  points: number[];
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  size: number;
  opacity: number;
}

type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'star';

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
  draggable?: boolean;
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
  draggable?: boolean;
  isEditing?: boolean;
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

interface GridSettings {
  enabled: boolean;
  size: number;
  color: string;
  opacity: number;
}

interface HistoryItem {
  lines: LineData[][];
  textBoxes: TextBoxData[][];
  shapes: ShapeData[][];
  stickyNotes: StickyNoteData[][];
}

type ToolMode = 'select' | 'pen' | 'highlighter' | 'text' | 'eraser' | 'shape' | 'sticky';

export default function MicrosoftStyleCanvasBoard({ 
  noteId, 
  isReadOnly = false 
}: { 
  noteId: string;
  isReadOnly?: boolean;
}) {
  const storageKey = `canvas-${noteId}`;
  const { data: session } = useSession();
  const toast = useToast();
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [showShare, setShowShare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  // Using usePersistentState for localStorage persistence
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

  // Tool states
  const [mode, setMode] = useState<ToolMode>('select');
  const [pageIndex, setPageIndex] = useState(0);
  const isDrawing = useRef(false);
  const [penSize, setPenSize] = useState(3);
  const [penColor, setPenColor] = useState('#000000');
  const [highlighterOpacity, setHighlighterOpacity] = useState(0.3);
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedFontSize, setSelectedFontSize] = useState(20);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  
  // History management
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI states
  const [showToolbar, setShowToolbar] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    enabled: false,
    size: 20,
    color: '#e0e0e0',
    opacity: 0.5
  });
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const [selectedElement, setSelectedElement] = useState<{
    type: 'shape' | 'text' | 'sticky';
    id: string;
  } | null>(null);
  const [cursor, setCursor] = useState('default');
  const [previewShape, setPreviewShape] = useState<ShapeData | null>(null);
  const [stageSize, setStageSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });
  
  const colors = [
    '#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666',
    '#0078d4', '#107c10', '#d83b01', '#e3008c', '#008272',
    '#ffb900', '#00bcf2', '#b4009e', '#5c2d91', '#00b294',
    '#ffffff', '#f2f2f2', '#e6e6e6', '#d9d9d9', '#cccccc'
  ];

  const shapesList = [
    { type: 'rectangle' as ShapeType, icon: <FaSquare />, label: 'Rectangle' },
    { type: 'circle' as ShapeType, icon: <FaCircle />, label: 'Circle' },
    { type: 'line' as ShapeType, icon: <div className="w-4 h-0.5 bg-current" />, label: 'Line' },
    { type: 'arrow' as ShapeType, icon: <FaLongArrowAltRight />, label: 'Arrow' },
    { type: 'triangle' as ShapeType, icon: <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-transparent border-b-current" />, label: 'Triangle' },
    { type: 'star' as ShapeType, icon: <div className="text-lg">★</div>, label: 'Star' }
  ];

  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Comic Sans MS'];

  const currentLines = lines[pageIndex] || [];
  const currentTextBoxes = textBoxes[pageIndex] || [];
  const currentShapes = shapes[pageIndex] || [];
  const currentStickyNotes = stickyNotes[pageIndex] || [];

  // Save to server function
  const saveToServer = useRef<NodeJS.Timeout | null>(null);
  
  const syncToServer = useCallback(() => {
  if (!session?.user?.id) return;
  if (isReadOnlyMode || isReadOnly) return;

  if (saveToServer.current) clearTimeout(saveToServer.current);

  saveToServer.current = setTimeout(async () => {
    try {
      // Ensure we're saving the complete data structure
      const canvasDataToSave = {
        lines: lines || [[]],
        textBoxes: textBoxes || [[]],
        shapes: shapes || [[]],
        stickyNotes: stickyNotes || [[]],
        background: background || '#ffffff'
      };

      console.log("Saving canvas data:", canvasDataToSave);

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
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(`Server responded with ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      console.log("Canvas SYNC SUCCESS");
    } catch (err) {
      console.error("Canvas SYNC FAILED", err);
      toast.error({ 
        title: "Failed to save canvas", 
        description: err instanceof Error ? err.message : "Please try again" 
      });
    }
  }, 700);
}, [session, noteId, lines, textBoxes, shapes, stickyNotes, background, isReadOnlyMode, isReadOnly, toast]);

  // Load content from server
  useEffect(() => {
    if (!noteId) return;

    const loadFromServer = async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}/content`);
        console.log("Canvas LOAD STATUS:", res.status);

        if (!res.ok) {
          console.error("Failed to load canvas");
          return;
        }

        const json = await res.json();
        console.log("Canvas LOADED FROM API:", json);

        if (json.readOnly || json.isImported || json.permission === 'view') {
          setIsReadOnlyMode(true);
        }

        if (json?.type === "canvas" && json?.data) {
         console.log("Setting canvas data from API:", json.data);
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

  // Auto-save when data changes
  useEffect(() => {
    if (!loading && !isReadOnlyMode && !isReadOnly) {
      syncToServer();
    }
  }, [lines, textBoxes, shapes, stickyNotes, background, loading, isReadOnlyMode, isReadOnly, syncToServer]);

  // Initialize history
  useEffect(() => {
    if (!loading && !isReadOnlyMode && !isReadOnly && history.length === 0) {
      pushHistory();
    }
  }, [loading]);

  // Update cursor
  useEffect(() => {
    if (isReadOnlyMode || isReadOnly) {
      setCursor('default');
      return;
    }
    switch (mode) {
      case 'select':
        setCursor('default');
        break;
      case 'pen':
      case 'highlighter':
        setCursor(`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${penSize * 2}' height='${penSize * 2}' viewBox='0 0 ${penSize * 2} ${penSize * 2}'%3E%3Ccircle cx='${penSize}' cy='${penSize}' r='${penSize}' fill='${penColor.replace('#', '%23')}' stroke='black' stroke-width='1'/%3E%3C/svg%3E") ${penSize} ${penSize}, auto`);
        break;
      case 'eraser':
        setCursor(`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${penSize * 2}' height='${penSize * 2}' viewBox='0 0 ${penSize * 2} ${penSize * 2}'%3E%3Ccircle cx='${penSize}' cy='${penSize}' r='${penSize}' fill='white' stroke='black' stroke-width='1'/%3E%3C/svg%3E") ${penSize} ${penSize}, auto`);
        break;
      case 'text':
        setCursor('text');
        break;
      case 'shape':
        setCursor('crosshair');
        break;
      case 'sticky':
        setCursor('pointer');
        break;
    }
  }, [mode, penSize, penColor, isReadOnlyMode, isReadOnly]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setStageSize({
          width: Math.max(320, Math.floor(rect.width)),
          height: Math.max(240, Math.floor(rect.height))
        });
      } else {
        setStageSize({
          width: Math.max(320, window.innerWidth - (showToolbar ? 256 : 0)),
          height: Math.max(240, window.innerHeight - 64)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showToolbar]);

  // History management
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

  const undo = () => {
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
    }
  };

  const redo = () => {
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
    }
  };

  // Helper function to get pointer position
  const getPointerPosition = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  };

  // Text input state
  const [textInput, setTextInput] = useState({ active: false, x: 0, y: 0, text: '', id: '' });

  const handleTextSave = () => {
    if (textInput.text.trim()) {
      pushHistory();
      const newTextBox: TextBoxData = {
        id: Date.now().toString(), // Ensure unique ID
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
        width: 200,
        isEditing: false
      };
      
      const updated = [...textBoxes];
      updated[pageIndex] = [...currentTextBoxes, newTextBox];
      setCanvasData(prev => ({ ...prev, textBoxes: updated }));
      setRenderTrigger(prev => prev + 1);
      toast.success({ title: "Text added", description: "Text box created" });
    }
    setTextInput({ active: false, x: 0, y: 0, text: '', id: '' });
  };

  // Mouse down handler
  const handleMouseDown = (e: KonvaMouseEvent) => {
    if (isReadOnlyMode || isReadOnly) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = getPointerPosition(stage);
    if (!pos) return;

    if (mode === 'select') {
      if (e.target === stage) {
        setSelectedElement(null);
      }
      return;
    }

    if (mode === 'text') {
      setTextInput({ active: true, x: pos.x, y: pos.y, text: '', id: Date.now().toString() });
      return;
    }

    if (mode === 'pen' || mode === 'highlighter' || mode === 'eraser') {
      pushHistory();
      isDrawing.current = true;
      const newLine: LineData = {
        points: [pos.x, pos.y],
        tool: mode,
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
        text: 'Double click to edit',
        id: Date.now().toString(),
        color: colors[Math.floor(Math.random() * 5) + 10],
        width: 200,
        height: 150
      };
      
      const updated = [...stickyNotes];
      updated[pageIndex] = [...currentStickyNotes, newSticky];
      setCanvasData(prev => ({ ...prev, stickyNotes: updated }));
      setRenderTrigger(prev => prev + 1);
    }
  };

  // Touch down handler
  const handleTouchStart = (e: KonvaTouchEvent) => {
    if (isReadOnlyMode || isReadOnly) return;
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = getPointerPosition(stage);
    if (!pos) return;

    if (mode === 'text') {
      setTextInput({ active: true, x: pos.x, y: pos.y, text: '', id: Date.now().toString() });
      return;
    }

    if (mode === 'pen' || mode === 'highlighter' || mode === 'eraser') {
      pushHistory();
      isDrawing.current = true;
      const newLine: LineData = {
        points: [pos.x, pos.y],
        tool: mode,
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
        text: 'Double click to edit',
        id: Date.now().toString(),
        color: colors[Math.floor(Math.random() * 5) + 10],
        width: 200,
        height: 150
      };
      
      const updated = [...stickyNotes];
      updated[pageIndex] = [...currentStickyNotes, newSticky];
      setCanvasData(prev => ({ ...prev, stickyNotes: updated }));
      setRenderTrigger(prev => prev + 1);
    }
  };

  // Mouse move handler
  const handleMouseMove = (e: KonvaMouseEvent) => {
    if (isReadOnlyMode || isReadOnly) return;
    if (!isDrawing.current && mode !== 'shape') return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = getPointerPosition(stage);
    if (!pos) return;

    if (isDrawing.current && (mode === 'pen' || mode === 'highlighter' || mode === 'eraser')) {
      const updated = [...lines];
      const current = [...currentLines];
      
      if (current.length === 0) return;
      
      const lastLine = { ...current[current.length - 1] };
      lastLine.points = [...lastLine.points, pos.x, pos.y];
      current[current.length - 1] = lastLine;
      updated[pageIndex] = current;
      setCanvasData(prev => ({ ...prev, lines: updated }));
      setRenderTrigger(prev => prev + 1);
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
        width,
        height,
        id: 'preview',
        fill: '#ffffff00',
        stroke: penColor,
        strokeWidth: 2,
        rotation: 0
      });
    }
  };

  // Touch move handler
  const handleTouchMove = (e: KonvaTouchEvent) => {
    if (isReadOnlyMode || isReadOnly) return;
    e.evt.preventDefault();
    if (!isDrawing.current && mode !== 'shape') return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = getPointerPosition(stage);
    if (!pos) return;

    if (isDrawing.current && (mode === 'pen' || mode === 'highlighter' || mode === 'eraser')) {
      const updated = [...lines];
      const current = [...currentLines];
      
      if (current.length === 0) return;
      
      const lastLine = { ...current[current.length - 1] };
      lastLine.points = [...lastLine.points, pos.x, pos.y];
      current[current.length - 1] = lastLine;
      updated[pageIndex] = current;
      setCanvasData(prev => ({ ...prev, lines: updated }));
      setRenderTrigger(prev => prev + 1);
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
        width,
        height,
        id: 'preview',
        fill: '#ffffff00',
        stroke: penColor,
        strokeWidth: 2,
        rotation: 0
      });
    }
  };

  // Mouse up handler
  const handleMouseUp = () => {
    if (isReadOnlyMode || isReadOnly) return;
    isDrawing.current = false;
    
    if (mode === 'shape' && shapeStart.current && previewShape) {
      pushHistory();
      const newShape: ShapeData = {
        ...previewShape,
        id: Date.now().toString(),
        fill: '#ffffff00'
      };
      
      const updated = [...shapes];
      updated[pageIndex] = [...currentShapes, newShape];
      setCanvasData(prev => ({ ...prev, shapes: updated }));
      shapeStart.current = null;
      setPreviewShape(null);
      setRenderTrigger(prev => prev + 1);
    }
  };

  // Touch up handler
  const handleTouchEnd = () => {
    if (isReadOnlyMode || isReadOnly) return;
    isDrawing.current = false;
    
    if (mode === 'shape' && shapeStart.current && previewShape) {
      pushHistory();
      const newShape: ShapeData = {
        ...previewShape,
        id: Date.now().toString(),
        fill: '#ffffff00'
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
      
      newScale = Math.max(0.1, Math.min(5, newScale));
      
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
      const dx = e.evt.deltaX;
      const dy = e.evt.deltaY;
      
      setStagePos(prev => ({
        x: prev.x - dx,
        y: prev.y - dy,
      }));
    }
  };

  // Toolbar functions
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

  const clearPage = () => {
    if (isReadOnlyMode || isReadOnly) return;
    pushHistory();
    const updatedLines = [...lines];
    const updatedText = [...textBoxes];
    const updatedShapes = [...shapes];
    const updatedSticky = [...stickyNotes];
    
    updatedLines[pageIndex] = [];
    updatedText[pageIndex] = [];
    updatedShapes[pageIndex] = [];
    updatedSticky[pageIndex] = [];
    
    setCanvasData(prev => ({
      ...prev,
      lines: updatedLines,
      textBoxes: updatedText,
      shapes: updatedShapes,
      stickyNotes: updatedSticky
    }));
    setRenderTrigger(prev => prev + 1);
  };

  const changeBackground = (color: string) => {
    if (isReadOnlyMode || isReadOnly) return;
    pushHistory();
    setCanvasData(prev => ({ ...prev, background: color }));
  };

  const exportCanvas = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const dataUrl = stage.toDataURL({
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 2
    });
    
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `canvas-${pageIndex + 1}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Render grid
  const renderGrid = () => {
    if (!gridSettings.enabled) return null;
    
    const gridSize = gridSettings.size;
    const gridLines = [];
    const width = stageSize.width;
    const height = stageSize.height;
    
    for (let i = 0; i < width / gridSize; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke={gridSettings.color}
          strokeWidth={1}
          opacity={gridSettings.opacity}
        />
      );
    }
    
    for (let i = 0; i < height / gridSize; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke={gridSettings.color}
          strokeWidth={1}
          opacity={gridSettings.opacity}
        />
      );
    }
    
    return gridLines;
  };

  // Tool definitions
  const toolDefinitions = [
    { mode: 'select' as ToolMode, icon: <FaMousePointer />, label: 'Select' },
    { mode: 'pen' as ToolMode, icon: <FaPen />, label: 'Pen' },
    { mode: 'highlighter' as ToolMode, icon: <FaHighlighter />, label: 'Highlighter' },
    { mode: 'eraser' as ToolMode, icon: <FaEraser />, label: 'Eraser' },
    { mode: 'text' as ToolMode, icon: <FaFont />, label: 'Text' },
    { mode: 'shape' as ToolMode, icon: <FaShapes />, label: 'Shapes' },
    { mode: 'sticky' as ToolMode, icon: <div className="text-lg">📝</div>, label: 'Sticky' }
  ];

  const finalReadOnly = isReadOnly || isReadOnlyMode;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {finalReadOnly && (
        <div className="bg-blue-50 border-b border-blue-200 p-2 text-center">
          <p className="text-blue-700 text-sm">📚 Read-Only Mode - You cannot edit this content.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 hover:bg-gray-100 rounded">
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">NV</span>
          </div>
          <span className="font-semibold text-sm hidden sm:inline">Canvas Board</span>
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0 || finalReadOnly} className="h-8 w-8 p-0"><FaUndo /></Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1 || finalReadOnly} className="h-8 w-8 p-0"><FaRedo /></Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
            <span className="text-xs">Page {pageIndex + 1}/{lines.length}</span>
            <Button variant="ghost" size="sm" onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0} className="h-6 w-6 p-0"><FaArrowLeft /></Button>
            <Button variant="ghost" size="sm" onClick={() => setPageIndex(Math.min(lines.length - 1, pageIndex + 1))} disabled={pageIndex === lines.length - 1} className="h-6 w-6 p-0"><FaArrowRight /></Button>
            <Button variant="ghost" size="sm" onClick={addPage} disabled={finalReadOnly} className="h-6 w-6 p-0"><FaPlus /></Button>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowShare(true)} className="hidden sm:flex bg-green-600"><FaShare /> Share</Button>
          <Button variant="primary" size="sm" onClick={exportCanvas} className="hidden sm:flex"><FaDownload /> Export</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowToolbar(!showToolbar)} className="hidden md:flex">{showToolbar ? <FaCompress /> : <FaExpand />}</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Toolbar - Simplified for brevity, keep your existing toolbar */}
        {showToolbar && !finalReadOnly && (
          <div className="hidden md:block w-64 bg-white border-r overflow-y-auto">
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {toolDefinitions.map((tool) => (
                  <button key={tool.mode} onClick={() => setMode(tool.mode)} className={`p-2 rounded ${mode === tool.mode ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <div className="text-center">{tool.icon}</div>
                    <div className="text-xs text-center">{tool.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1 mb-4">
                {colors.slice(0, 10).map((color) => (
                  <button key={color} onClick={() => setPenColor(color)} className="w-6 h-6 rounded-full border" style={{ backgroundColor: color }} />
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={clearPage} className="w-full text-red-600"><FaTrash /> Clear Page</Button>
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow p-1 flex gap-1">
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0 || finalReadOnly} className="h-7 w-7 p-0"><FaUndo /></Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1 || finalReadOnly} className="h-7 w-7 p-0"><FaRedo /></Button>
            <Button variant="ghost" size="sm" onClick={clearPage} disabled={finalReadOnly} className="h-7 w-7 p-0"><FaTrash /></Button>
          </div>

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
            style={{ cursor, backgroundColor: background, touchAction: 'none' }}
          >
            <Layer>
              {renderGrid()}
              {currentLines.map((line, i) => (
                <Line
                  key={`line-${i}-${line.points?.length || 0}`}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.size}
                  opacity={line.opacity}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                />
              ))}
              {currentShapes.map((shape, idx) => {
                if (shape.type === 'rectangle') {
                  return (
                    <Rect
                      key={`rect-${shape.id || idx}`}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      rotation={shape.rotation}
                      draggable={mode === 'select' && !finalReadOnly}
                      onClick={() => setSelectedElement({ type: 'shape', id: shape.id })}
                    />
                  );
                }
                if (shape.type === 'circle') {
                  return (
                    <Circle
                      key={`circle-${shape.id || idx}`}
                      x={shape.x + shape.width / 2}
                      y={shape.y + shape.height / 2}
                      radius={Math.max(shape.width, shape.height) / 2}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      rotation={shape.rotation}
                      draggable={mode === 'select' && !finalReadOnly}
                      onClick={() => setSelectedElement({ type: 'shape', id: shape.id })}
                    />
                  );
                }
                return null;
              })}
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
                  draggable={mode === 'select' && !text.isEditing && !finalReadOnly}
                  onClick={() => {
                    if (mode === 'select') {
                      setSelectedElement({ type: 'text', id: text.id });
                    }
                  }}
                  onDblClick={() => {
                    if (finalReadOnly) return;
                    const updated = [...textBoxes];
                    updated[pageIndex] = currentTextBoxes.map(t =>
                      t.id === text.id ? { ...t, isEditing: true } : t
                    );
                    setCanvasData(prev => ({ ...prev, textBoxes: updated }));
                  }}
                  onDragEnd={(e) => {
                    if (finalReadOnly) return;
                    const updated = [...textBoxes];
                    updated[pageIndex] = currentTextBoxes.map(t =>
                      t.id === text.id ? {
                        ...t,
                        x: e.target.x(),
                        y: e.target.y()
                      } : t
                    );
                    setCanvasData(prev => ({ ...prev, textBoxes: updated }));
                  }}
                />
              ))}
              {previewShape && previewShape.type === 'rectangle' && !finalReadOnly && (
                <Rect
                  x={previewShape.x}
                  y={previewShape.y}
                  width={previewShape.width}
                  height={previewShape.height}
                  stroke={previewShape.stroke}
                  strokeWidth={previewShape.strokeWidth}
                  dash={[5, 5]}
                />
              )}
            </Layer>
          </Stage>

          <div className="absolute bottom-2 right-2 z-10 bg-white rounded-lg shadow p-1">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setScale(prev => Math.max(0.1, prev / 1.2))} className="h-6 w-6 p-0"><FaMinus /></Button>
              <span className="text-xs min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={() => setScale(prev => Math.min(5, prev * 1.2))} className="h-6 w-6 p-0"><FaPlus /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Text Input Modal */}
      {textInput.active && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setTextInput({ active: false, x: 0, y: 0, text: '', id: '' })}>
          <div className="bg-white rounded-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Enter Text</h3>
            <textarea
              autoFocus
              value={textInput.text}
              onChange={(e) => setTextInput(prev => ({ ...prev, text: e.target.value }))}
              className="w-full p-2 border rounded mb-3 resize-none"
              rows={3}
              placeholder="Type your text here..."
            />
            <div className="flex gap-2">
              <Button onClick={() => setTextInput({ active: false, x: 0, y: 0, text: '', id: '' })} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleTextSave} className="flex-1 bg-blue-600 text-white">Add Text</Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-bold">Tools</h3><button onClick={() => setShowMobileMenu(false)}><FaTimes /></button></div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {toolDefinitions.map((tool) => (
                <button key={tool.mode} onClick={() => { setMode(tool.mode); setShowMobileMenu(false); }} className={`p-2 rounded ${mode === tool.mode ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <div className="text-center">{tool.icon}</div>
                  <div className="text-xs text-center">{tool.label}</div>
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => { clearPage(); setShowMobileMenu(false); }} className="w-full text-red-600"><FaTrash /> Clear</Button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-bold">Share</h3><button onClick={() => setShowShare(false)}>✕</button></div>
            <SharingPanel noteId={noteId} />
          </div>
        </div>
      )}
    </div>
  );
}