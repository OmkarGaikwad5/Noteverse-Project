'use client'
import { Stage, Layer, Line, Text, Circle, Rect, Arrow, Transformer } from 'react-konva';
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
  FaCopy,
  FaPaste,
  FaSave,
  FaShare,
  FaRuler,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaBold,
  FaItalic,
  FaUnderline,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import Konva from 'konva';
import { usePersistentState } from '@/hooks/usePersistentState';
import type { KonvaEventObject } from 'konva/lib/Node';

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

export default function MicrosoftStyleCanvasBoard({ noteId }: { noteId: string }) {
  const storageKey = `canvas-${noteId}`;
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Combined Persistent State
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

  // Destructure for ease of use
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
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    enabled: false,
    size: 20,
    color: '#e0e0e0',
    opacity: 0.5
  });
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
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
  
  // Colors palette
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

  // Fonts array
  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Comic Sans MS'];

  const currentLines = lines[pageIndex] || [];
  const currentTextBoxes = textBoxes[pageIndex] || [];
  const currentShapes = shapes[pageIndex] || [];
  const currentStickyNotes = stickyNotes[pageIndex] || [];

  // Initialize history
  useEffect(() => {
    pushHistory();
  }, []);

  // Update cursor
  useEffect(() => {
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
  }, [mode, penSize, penColor]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - (isMobile ? 120 : 64)
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // History management
  const pushHistory = useCallback(() => {
    const newHistory = [...history.slice(0, historyIndex + 1), {
      lines: JSON.parse(JSON.stringify(lines)),
      textBoxes: JSON.parse(JSON.stringify(textBoxes)),
      shapes: JSON.parse(JSON.stringify(shapes)),
      stickyNotes: JSON.parse(JSON.stringify(stickyNotes))
    }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, lines, textBoxes, shapes, stickyNotes]);

  const undo = () => {
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
    }
  };

  const redo = () => {
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
    }
  };

  // Helper function to get pointer position from event
  const getPointerPosition = (e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return null;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  };

  // Mouse down handler
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = getPointerPosition(e);
    if (!pos) return;

    if (mode === 'select') {
      if (e.target === stage) {
        setSelectedElement(null);
      }
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
    } else if (mode === 'shape') {
      shapeStart.current = { x: pos.x, y: pos.y };
    } else if (mode === 'text') {
      pushHistory();
      const newTextBox: TextBoxData = {
        x: pos.x,
        y: pos.y,
        text: 'Click to type...',
        id: Date.now().toString(),
        fontSize: selectedFontSize,
        fontFamily: selectedFont,
        fill: penColor,
        align: textAlign,
        bold: textBold,
        italic: textItalic,
        underline: textUnderline,
        width: 200,
        isEditing: true
      };
      
      const updated = [...textBoxes];
      updated[pageIndex] = [...currentTextBoxes, newTextBox];
      setCanvasData(prev => ({ ...prev, textBoxes: updated }));
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
    }
  };

  // Touch down handler
  const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault(); // Prevent scrolling
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = getPointerPosition(e);
    if (!pos) return;

    if (mode === 'select') {
      if (e.target === stage) {
        setSelectedElement(null);
      }
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
    } else if (mode === 'shape') {
      shapeStart.current = { x: pos.x, y: pos.y };
    } else if (mode === 'text') {
      pushHistory();
      const newTextBox: TextBoxData = {
        x: pos.x,
        y: pos.y,
        text: 'Click to type...',
        id: Date.now().toString(),
        fontSize: selectedFontSize,
        fontFamily: selectedFont,
        fill: penColor,
        align: textAlign,
        bold: textBold,
        italic: textItalic,
        underline: textUnderline,
        width: 200,
        isEditing: true
      };
      
      const updated = [...textBoxes];
      updated[pageIndex] = [...currentTextBoxes, newTextBox];
      setCanvasData(prev => ({ ...prev, textBoxes: updated }));
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
    }
  };

  // Mouse move handler
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current && mode !== 'shape') return;
    
    const pos = getPointerPosition(e);
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
    } else if (mode === 'shape' && shapeStart.current) {
      const start = shapeStart.current;
      const x = Math.min(start.x, pos.x);
      const y = Math.min(start.y, pos.y);
      const width = Math.abs(pos.x - start.x);
      const height = Math.abs(pos.y - start.y);

      const fill = '#ffffff00';
      
      setPreviewShape({
        type: selectedShape,
        x,
        y,
        width,
        height,
        id: 'preview',
        fill: fill,
        stroke: penColor,
        strokeWidth: 2,
        rotation: 0
      });
    }
  };

  // Touch move handler
  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault(); // Prevent scrolling
    if (!isDrawing.current && mode !== 'shape') return;
    
    const pos = getPointerPosition(e);
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
    } else if (mode === 'shape' && shapeStart.current) {
      const start = shapeStart.current;
      const x = Math.min(start.x, pos.x);
      const y = Math.min(start.y, pos.y);
      const width = Math.abs(pos.x - start.x);
      const height = Math.abs(pos.y - start.y);

      const fill = '#ffffff00';
      
      setPreviewShape({
        type: selectedShape,
        x,
        y,
        width,
        height,
        id: 'preview',
        fill: fill,
        stroke: penColor,
        strokeWidth: 2,
        rotation: 0
      });
    }
  };

  // Mouse up handler
  const handleMouseUp = () => {
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
    }
  };

  // Touch up handler
  const handleTouchEnd = () => {
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
    }
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
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
    pushHistory();
    setCanvasData(prev => ({
      ...prev,
      lines: [...lines, []],
      textBoxes: [...textBoxes, []],
      shapes: [...shapes, []],
      stickyNotes: [...stickyNotes, []]
    }));
    setPageIndex(lines.length);
  };

  const deletePage = () => {
    if (lines.length <= 1) return;
    
    pushHistory();
    const updatedLines = lines.filter((_, i) => i !== pageIndex);
    const updatedText = textBoxes.filter((_, i) => i !== pageIndex);
    const updatedShapes = shapes.filter((_, i) => i !== pageIndex);
    const updatedSticky = stickyNotes.filter((_, i) => i !== pageIndex);
    
    setCanvasData(prev => ({
      ...prev,
      lines: updatedLines,
      textBoxes: updatedText,
      shapes: updatedShapes,
      stickyNotes: updatedSticky
    }));
    
    setPageIndex(Math.max(0, pageIndex - 1));
  };

  const clearPage = () => {
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
  };

  const changeBackground = (color: string) => {
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Responsive Header */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">NV</span>
            </div>
            <span className="font-semibold text-gray-800 text-sm sm:text-base hidden xs:inline">NoteVerse</span>
          </div>
          
          {/* Desktop Undo/Redo */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="gap-1 hover:bg-gray-100"
            >
              <FaUndo className="text-xs sm:text-sm" />
              <span className="hidden lg:inline">Undo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="gap-1 hover:bg-gray-100"
            >
              <FaRedo className="text-xs sm:text-sm" />
              <span className="hidden lg:inline">Redo</span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Quick Actions */}
          <div className="flex md:hidden items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="h-8 w-8 p-0"
            >
              <FaUndo className="text-xs" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="h-8 w-8 p-0"
            >
              <FaRedo className="text-xs" />
            </Button>
          </div>

          {/* Page Navigation - Responsive */}
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg px-2 sm:px-3 py-1">
            <span className="text-xs sm:text-sm text-gray-600 hidden xs:inline">
              Page {pageIndex + 1}/{lines.length}
            </span>
            <span className="text-xs sm:text-sm text-gray-600 xs:hidden">
              {pageIndex + 1}/{lines.length}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
                disabled={pageIndex === 0}
                className="h-6 w-6 p-0"
              >
                <FaArrowLeft className="text-xs" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageIndex(prev => Math.min(lines.length - 1, prev + 1))}
                disabled={pageIndex === lines.length - 1}
                className="h-6 w-6 p-0"
              >
                <FaArrowRight className="text-xs" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={addPage}
              className="h-6 w-6 p-0"
            >
              <FaPlus className="text-xs" />
            </Button>
          </div>
          
          {/* Export Button - Hidden on mobile, shown in mobile menu */}
          <Button variant="primary" size="sm" onClick={exportCanvas} className="hidden sm:flex gap-2">
            <FaDownload className="text-xs sm:text-sm" />
            <span className="hidden md:inline">Export</span>
          </Button>
          
          {/* Toolbar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowToolbar(!showToolbar)}
            className="hidden md:flex"
          >
            {showToolbar ? <FaCompress /> : <FaExpand />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Tools</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FaTimes />
                </button>
              </div>
              
              {/* Mobile Tools Grid */}
              <div className="space-y-6">
                {/* Tools Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Tools</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {toolDefinitions.map((tool) => (
                      <button
                        key={tool.mode}
                        onClick={() => {
                          setMode(tool.mode);
                          setShowMobileMenu(false);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg ${
                          mode === tool.mode
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`text-base ${mode === tool.mode ? 'text-blue-600' : 'text-gray-600'}`}>
                          {tool.icon}
                        </div>
                        <span className="text-xs mt-1 text-gray-600">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Colors</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.slice(0, 10).map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setPenColor(color);
                          setShowMobileMenu(false);
                        }}
                        className={`w-8 h-8 rounded border-2 ${
                          penColor === color ? 'border-blue-500' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Export Button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    exportCanvas();
                    setShowMobileMenu(false);
                  }}
                  className="w-full gap-2"
                >
                  <FaDownload /> Export Canvas
                </Button>

                {/* Clear Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearPage();
                    setShowMobileMenu(false);
                  }}
                  className="w-full gap-2"
                >
                  <FaTrash /> Clear Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side Toolbar - Hidden on mobile */}
        {showToolbar && !isMobile && (
          <div className="w-64 bg-white border-r border-gray-200 shadow-lg overflow-y-auto hidden md:block">
            <div className="p-4 space-y-6">
              {/* Tools Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                  {toolDefinitions.map((tool) => (
                    <button
                      key={tool.mode}
                      onClick={() => setMode(tool.mode)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                        mode === tool.mode
                          ? 'bg-blue-50 border border-blue-200 shadow-sm'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                      title={tool.label}
                    >
                      <div className={`text-lg mb-1 ${mode === tool.mode ? 'text-blue-600' : 'text-gray-600'}`}>
                        {tool.icon}
                      </div>
                      <span className="text-xs text-gray-600">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Colors</h3>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <FaPalette className="text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPenColor(color)}
                      className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                        penColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                {showColorPicker && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="w-full h-8 cursor-pointer rounded"
                    />
                  </div>
                )}
              </div>

              {/* Tool Settings */}
              {(mode === 'pen' || mode === 'highlighter' || mode === 'eraser') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Size: {penSize}px
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={penSize}
                      onChange={(e) => setPenSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  {mode === 'highlighter' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Opacity: {Math.round(highlighterOpacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.1}
                        value={highlighterOpacity}
                        onChange={(e) => setHighlighterOpacity(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Shape Selector */}
              {mode === 'shape' && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shapes</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {shapesList.map((shape) => (
                      <button
                        key={shape.type}
                        onClick={() => setSelectedShape(shape.type)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                          selectedShape === shape.type
                            ? 'bg-blue-50 border border-blue-200 shadow-sm'
                            : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                        }`}
                        title={shape.label}
                      >
                        <div className={`text-lg mb-1 ${
                          selectedShape === shape.type ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {shape.icon}
                        </div>
                        <span className="text-xs text-gray-600">{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Formatting */}
              {mode === 'text' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Font</h3>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {fonts.map((font: string) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Size: {selectedFontSize}px
                    </label>
                    <input
                      type="range"
                      min={8}
                      max={72}
                      value={selectedFontSize}
                      onChange={(e) => setSelectedFontSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Format</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTextBold(!textBold)}
                        className={`p-2 rounded transition-colors ${
                          textBold ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <FaBold />
                      </button>
                      <button
                        onClick={() => setTextItalic(!textItalic)}
                        className={`p-2 rounded transition-colors ${
                          textItalic ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <FaItalic />
                      </button>
                      <button
                        onClick={() => setTextUnderline(!textUnderline)}
                        className={`p-2 rounded transition-colors ${
                          textUnderline ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <FaUnderline />
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTextAlign('left')}
                        className={`p-2 rounded transition-colors ${
                          textAlign === 'left' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <FaAlignLeft />
                      </button>
                      <button
                        onClick={() => setTextAlign('center')}
                        className={`p-2 rounded transition-colors ${
                          textAlign === 'center' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <FaAlignCenter />
                      </button>
                      <button
                        onClick={() => setTextAlign('right')}
                        className={`p-2 rounded transition-colors ${
                          textAlign === 'right' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <FaAlignRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Canvas Settings */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Canvas</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Grid</label>
                    <button
                      onClick={() => setGridSettings(prev => ({
                        ...prev,
                        enabled: !prev.enabled
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        gridSettings.enabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        gridSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Background</label>
                    <div className="flex gap-2">
                      {['#ffffff', '#f8f9fa', '#e9ecef', '#f0f0f0', '#1a1a1a'].map((color) => (
                        <button
                          key={color}
                          onClick={() => changeBackground(color)}
                          className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                            background === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Floating Toolbar for quick access - Responsive */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-1 sm:p-2">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Toolbar Toggle - Only on mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden h-8 w-8 p-0"
                title="Show tools"
              >
                <FaBars className="text-sm" />
              </Button>

              {/* Desktop toolbar toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToolbar(!showToolbar)}
                className="hidden md:flex h-8 w-8 p-0"
                title={showToolbar ? "Hide toolbar" : "Show toolbar"}
              >
                {showToolbar ? <FaCompress className="text-sm" /> : <FaExpand className="text-sm" />}
              </Button>
              
              <div className="w-px h-6 bg-gray-300 mx-1 hidden md:block"></div>
              
              {/* Undo/Redo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="h-8 w-8 p-0"
                title="Undo"
              >
                <FaUndo className="text-sm" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="h-8 w-8 p-0"
                title="Redo"
              >
                <FaRedo className="text-sm" />
              </Button>
              
              {/* Clear - Hidden on very small screens */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPage}
                className="hidden xs:flex h-8 w-8 p-0"
                title="Clear page"
              >
                <FaTrash className="text-sm" />
              </Button>
              
              <div className="w-px h-6 bg-gray-300 mx-1 hidden xs:block"></div>
              
              {/* Zoom Reset */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setScale(1);
                  setStagePos({ x: 0, y: 0 });
                }}
                className="h-8 w-8 p-0 text-xs"
                title="Reset zoom"
              >
                100%
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <Stage
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
              touchAction: 'none'
            }}
            className="bg-white"
          >
            <Layer>
              {/* Grid */}
              {renderGrid()}

              {/* Drawings */}
              {currentLines.map((line, i) => (
                <Line
                  key={i}
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

              {/* Shapes */}
              {currentShapes.map((shape) => {
                const isSelected = selectedElement?.type === 'shape' && selectedElement?.id === shape.id;
                
                if (shape.type === 'rectangle') {
                  return (
                    <Rect
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      rotation={shape.rotation}
                      draggable={mode === 'select'}
                      onClick={() => setSelectedElement({ type: 'shape', id: shape.id })}
                      onDragEnd={(e) => {
                        const updated = [...shapes];
                        updated[pageIndex] = currentShapes.map(s =>
                          s.id === shape.id ? {
                            ...s,
                            x: e.target.x(),
                            y: e.target.y()
                          } : s
                        );
                        setCanvasData(prev => ({ ...prev, shapes: updated }));
                      }}
                    />
                  );
                } else if (shape.type === 'circle') {
                  return (
                    <Circle
                      key={shape.id}
                      x={shape.x + shape.width / 2}
                      y={shape.y + shape.height / 2}
                      radius={Math.max(shape.width, shape.height) / 2}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      rotation={shape.rotation}
                      draggable={mode === 'select'}
                      onClick={() => setSelectedElement({ type: 'shape', id: shape.id })}
                      onDragEnd={(e) => {
                        const updated = [...shapes];
                        updated[pageIndex] = currentShapes.map(s =>
                          s.id === shape.id ? {
                            ...s,
                            x: e.target.x() - shape.width / 2,
                            y: e.target.y() - shape.height / 2
                          } : s
                        );
                        setCanvasData(prev => ({ ...prev, shapes: updated }));
                      }}
                    />
                  );
                } else if (shape.type === 'arrow') {
                  return (
                    <Arrow
                      key={shape.id}
                      points={[
                        shape.x,
                        shape.y,
                        shape.x + shape.width,
                        shape.y + shape.height
                      ]}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      fill={shape.stroke}
                      pointerLength={10}
                      pointerWidth={10}
                      draggable={mode === 'select'}
                      onClick={() => setSelectedElement({ type: 'shape', id: shape.id })}
                      onDragEnd={(e) => {
                        const updated = [...shapes];
                        updated[pageIndex] = currentShapes.map(s =>
                          s.id === shape.id ? {
                            ...s,
                            x: e.target.x(),
                            y: e.target.y()
                          } : s
                        );
                        setCanvasData(prev => ({ ...prev, shapes: updated }));
                      }}
                    />
                  );
                }
                return null;
              })}

              {/* Text Boxes */}
              {currentTextBoxes.map((text) => (
                <Text
                  key={text.id}
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
                  draggable={mode === 'select' && !text.isEditing}
                  onClick={() => {
                    if (mode === 'select') {
                      setSelectedElement({ type: 'text', id: text.id });
                    }
                  }}
                  onDblClick={() => {
                    const updated = [...textBoxes];
                    updated[pageIndex] = currentTextBoxes.map(t =>
                      t.id === text.id ? { ...t, isEditing: true } : t
                    );
                    setCanvasData(prev => ({ ...prev, textBoxes: updated }));
                  }}
                  onDragEnd={(e) => {
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

              {/* Preview Shape */}
              {previewShape && previewShape.type === 'rectangle' && (
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

          {/* Zoom Controls - Responsive */}
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 sm:p-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScale(prev => Math.max(0.1, prev / 1.2))}
                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                  title="Zoom out"
                >
                  <FaMinus className="text-xs sm:text-sm" />
                </Button>
                
                <div className="text-center min-w-[40px] sm:min-w-[70px]">
                  <div className="text-xs sm:text-sm font-medium text-gray-700">
                    {Math.round(scale * 100)}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 hidden xs:block">Zoom</div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScale(prev => Math.min(5, prev * 1.2))}
                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                  title="Zoom in"
                >
                  <FaPlus className="text-xs sm:text-sm" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}