
'use client'
import { Stage, Layer, Line, Text, Circle, Rect, Star, RegularPolygon, Arrow as KonvaArrow, Path } from 'react-konva';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/custom/button';
import { FaPen, FaEraser, FaFont, FaTrash, FaPlus, FaArrowLeft, FaArrowRight, FaUndo, FaRedo, FaImage, FaMinus, FaShapes } from 'react-icons/fa';
import Konva from 'konva';
import { usePersistentState } from '@/hooks/usePersistentState';
import MainToolbar from '@/components/Toolbars/MainToolbar';

// Types (Same as before, standardized)
export interface LineData {
    points: number[];
    tool: 'pen' | 'eraser';
    size: number;
    color?: string;
}
export interface ShapeData {
    type: 'circle' | 'rectangle' | 'line' | 'triangle' | 'star' | 'polygon' | 'arrow' | 'diamond' | 'bubble' | 'heart' | 'cloud';
    x: number;
    y: number;
    width: number;
    height: number;
    id: string;
    draggable?: boolean;
    fill?: string;
}
export interface TextBoxData {
    x: number;
    y: number;
    text: string;
    id: string;
    draggable?: boolean;
    isEditing?: boolean;
}

export interface PageContent {
    lines: LineData[];
    shapes: ShapeData[];
    textBoxes: TextBoxData[];
}

interface CanvasPageProps {
    pageId: string;
    initialData?: PageContent;
    onSave?: (data: PageContent) => void;
}

export default function CanvasPage({ pageId, initialData, onSave }: CanvasPageProps) {
    const storageKey = `page-content-${pageId}`;

    const [canvasData, setCanvasData] = usePersistentState<PageContent>(storageKey, initialData || {
        lines: [],
        shapes: [],
        textBoxes: []
    }, pageId);

    // Destructure for ease
    const { lines, shapes, textBoxes } = canvasData;

    // Helper setters
    const updateLines = (newLines: LineData[]) => setCanvasData(prev => ({ ...prev, lines: newLines }));
    const updateShapes = (newShapes: ShapeData[]) => setCanvasData(prev => ({ ...prev, shapes: newShapes }));
    const updateTextBoxes = (newBoxes: TextBoxData[]) => setCanvasData(prev => ({ ...prev, textBoxes: newBoxes }));

    const [mode, setMode] = useState<'pen' | 'text' | 'eraser' | 'shape'>('pen');
    const isDrawing = useRef(false);
    const [penSize, setPenSize] = useState(4);

    // Undo/Redo Stacks
    const undoStack = useRef<PageContent[]>([]);
    const redoStack = useRef<PageContent[]>([]);

    const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | 'triangle' | 'star' | 'polygon' | 'arrow' | 'diamond' | 'bubble' | 'heart' | 'cloud'>('rectangle');
    const shapeStart = useRef<{ x: number; y: number } | null>(null);
    const stageRef = useRef<Konva.Stage | null>(null);
    const [cursor, setCursor] = useState('crosshair');
    const [previewShape, setPreviewShape] = useState<ShapeData | null>(null);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);

    const [scale, setScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageSize, setStageSize] = useState({ width: 1000, height: 1000 });

    // Handle Resize
    const [eraserMode, setEraserMode] = useState<'standard' | 'precise' | 'stroke'>('standard');
    const [penColor, setPenColor] = useState('#000000');

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            setStageSize({
                width: window.innerWidth,
                height: window.innerHeight - 0 // Full height, no toolbar subtraction needed if floating
            });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cursor update
    useEffect(() => {
        switch (mode) {
            case 'pen': setCursor('crosshair'); break;
            case 'eraser':
                setCursor(eraserMode === 'precise' ? 'crosshair' : 'default'); // TODO: Custom cursor
                break;
            case 'text': setCursor('text'); break;
            case 'shape': setCursor('crosshair'); break;
            default: setCursor('default');
        }
    }, [mode, eraserMode]);

    const pushUndo = () => {
        undoStack.current.push(JSON.parse(JSON.stringify(canvasData)));
        redoStack.current = [];
    };

    const undo = () => {
        if (undoStack.current.length === 0) return;
        redoStack.current.push(canvasData);
        const last = undoStack.current.pop();
        if (last) setCanvasData(last);
    };

    const redo = () => {
        if (redoStack.current.length === 0) return;
        undoStack.current.push(canvasData);
        const next = redoStack.current.pop();
        if (next) setCanvasData(next);
    };

    // --- Interaction Handlers (Simplified from CanvasBoard) ---

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === e.target.getStage()) setSelectedShapeId(null);
        const stage = e.target.getStage();
        if (!stage) return;

        // Prevent drawing if stroke eraser is on (it's a click-to-delete tool)
        if (mode === 'eraser' && eraserMode === 'stroke') return;

        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        const pos = transform.point(stage.getPointerPosition() || { x: 0, y: 0 });

        if (mode === 'shape') {
            shapeStart.current = { x: pos.x, y: pos.y };
        } else if (mode === 'pen' || mode === 'eraser') {
            pushUndo();
            isDrawing.current = true;
            const newLine: LineData = {
                points: [pos.x, pos.y],
                tool: mode,
                size: mode === 'eraser' && eraserMode === 'precise' ? 5 : penSize, // Smaller size for precise
                color: mode === 'pen' ? penColor : '#ffffff'
            };
            updateLines([...lines, newLine]);
        } else if (mode === 'text') {
            const clickedOnText = textBoxes.some(box =>
                box.isEditing || (pos.x >= box.x && pos.x <= box.x + 100 && pos.y >= box.y && pos.y <= box.y + 30)
            );
            if (!clickedOnText) {
                pushUndo();
                const newBox: TextBoxData = {
                    x: pos.x, y: pos.y, text: 'Double click to edit', id: Date.now().toString(), isEditing: true
                };
                updateTextBoxes([...textBoxes, newBox]);
            }
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        const pos = transform.point(stage.getPointerPosition() || { x: 0, y: 0 });

        if (isDrawing.current && (mode === 'pen' || mode === 'eraser')) {
            const newLines = [...lines];
            const lastLine = newLines[newLines.length - 1];
            lastLine.points = lastLine.points.concat([pos.x, pos.y]);
            updateLines(newLines);
        } else if (mode === 'shape' && shapeStart.current) {
            const start = shapeStart.current;
            setPreviewShape({
                type: selectedShape,
                x: Math.min(start.x, pos.x),
                y: Math.min(start.y, pos.y),
                width: Math.abs(pos.x - start.x),
                height: Math.abs(pos.y - start.y),
                id: 'preview',
            });
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
        if (mode === 'shape' && shapeStart.current && previewShape) {
            pushUndo();
            updateShapes([...shapes, { ...previewShape, id: Date.now().toString() }]);
            setPreviewShape(null);
            shapeStart.current = null;
        }
        if (onSave) onSave(canvasData);
    };

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        if (e.evt.ctrlKey) {
            // Zoom
            const oldScale = scale;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };
            const newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
            setScale(newScale);
            const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            setStagePos(newPos);
        } else {
            // Pan
            setStagePos(prev => ({ x: prev.x - e.evt.deltaX, y: prev.y - e.evt.deltaY }));
        }
    };

    // Stroke Eraser Logic
    const handleLineClick = (e: Konva.KonvaEventObject<any>, index: number) => {
        if (mode === 'eraser' && eraserMode === 'stroke') {
            e.cancelBubble = true;
            pushUndo();
            const newLines = lines.filter((_, i) => i !== index);
            updateLines(newLines);
        }
    };

    const handleShapeClick = (e: Konva.KonvaEventObject<any>, id: string) => {
        if (mode === 'eraser' && eraserMode === 'stroke') {
            e.cancelBubble = true;
            pushUndo();
            const newShapes = shapes.filter(s => s.id !== id);
            updateShapes(newShapes);
        }
    };

    // Text Handlers
    const handleTextDblClick = (id: string) => {
        const newBoxes = textBoxes.map(box =>
            box.id === id ? { ...box, isEditing: true } : box
        );
        updateTextBoxes(newBoxes);
    };

    const handleTextChange = (id: string, newText: string) => {
        const newBoxes = textBoxes.map(box =>
            box.id === id ? { ...box, text: newText } : box
        );
        updateTextBoxes(newBoxes);
    };

    const handleTextBlur = (id: string) => {
        const newBoxes = textBoxes.map(box =>
            box.id === id ? { ...box, isEditing: false } : box
        );
        updateTextBoxes(newBoxes);
    };

    // Helper to render shapes (Used for both real shapes and preview)
    const renderShape = (shape: ShapeData, isPreview = false) => {
        // Extract key and other props to avoid spreading key into commonProps
        const { id, type, x, y, width, height, ...rest } = shape;

        const commonProps = {
            stroke: isPreview ? "gray" : "black",
            strokeWidth: 2,
            draggable: !isPreview && mode !== 'pen' && mode !== 'eraser', // Only draggable if not drawing
            dash: isPreview ? [5, 5] : undefined,
            onMouseDown: (e: any) => !isPreview && handleShapeClick(e, id),
            onTap: (e: any) => !isPreview && handleShapeClick(e, id),
            onMouseEnter: () => {
                if (!isPreview && mode === 'eraser' && eraserMode === 'stroke') {
                    const container = stageRef.current?.container();
                    if (container) container.style.cursor = 'crosshair';
                }
            },
            onMouseLeave: () => {
                const container = stageRef.current?.container();
                if (container) container.style.cursor = cursor;
            },
            ...rest
        };

        const shapeKey = isPreview ? 'preview' : id;

        switch (type) {
            case 'rectangle':
                return <Rect key={shapeKey} x={x} y={y} width={width} height={height} {...commonProps} />;
            case 'circle':
                return <Circle key={shapeKey} x={x + width / 2} y={y + height / 2} radius={width / 2} {...commonProps} />;
            case 'triangle':
                return <RegularPolygon key={shapeKey} x={x + width / 2} y={y + height / 2} sides={3} radius={width / 2} {...commonProps} />;
            case 'star':
                return <Star key={shapeKey} x={x + width / 2} y={y + height / 2} numPoints={5} innerRadius={width / 4} outerRadius={width / 2} {...commonProps} />;
            case 'polygon':
                return <RegularPolygon key={shapeKey} x={x + width / 2} y={y + height / 2} sides={6} radius={width / 2} {...commonProps} />;
            case 'arrow':
                return <KonvaArrow key={shapeKey} points={[x, y + height / 2, x + width, y + height / 2]} pointerLength={10} pointerWidth={10} {...commonProps} />;
            case 'diamond':
                return <RegularPolygon key={shapeKey} x={x + width / 2} y={y + height / 2} sides={4} radius={width / 2} {...commonProps} />;
            case 'bubble':
                return <Path key={shapeKey} x={x} y={y} scaleX={width / 100} scaleY={height / 100} data="M100,50c0,27.6-22.4,50-50,50S0,77.6,0,50S22.4,0,50,0S100,22.4,100,50z M80,80L100,100" {...commonProps} />;
            case 'heart':
                return <Path key={shapeKey} x={x} y={y} scaleX={width / 100} scaleY={height / 100} data="M50,90 C10,50 0,30 0,20 C0,10 10,0 25,0 C35,0 45,10 50,20 C55,10 65,0 75,0 C90,0 100,10 100,20 C100,30 90,50 50,90 Z" {...commonProps} />;
            case 'cloud':
                return <Path key={shapeKey} x={x} y={y} scaleX={width / 100} scaleY={height / 100} data="M25,60 a20,20 0 0,1 0,-40 a15,15 0 0,1 25,-10 a20,20 0 0,1 25,10 a25,25 0 0,1 25,40 z" {...commonProps} />;
            default:
                return null;
        }
    };

    // --- Render ---
    return (
        <div className="relative bg-transparent w-full h-full overflow-hidden">
            {/* Toolbar Overlay */}
            <MainToolbar
                mode={mode} setMode={setMode}
                undo={undo} redo={redo}
                selectedShape={selectedShape} setSelectedShape={setSelectedShape}
                eraserMode={eraserMode} setEraserMode={setEraserMode}
                penSize={penSize} setPenSize={setPenSize}
                penColor={penColor} setPenColor={setPenColor}
            />

            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                scaleX={scale}
                scaleY={scale}
                x={stagePos.x}
                y={stagePos.y}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                style={{ cursor }}
            >
                <Layer>
                    {/* Fixed visuals: No shadow, clean white paper */}
                    <Rect x={0} y={0} width={2000} height={3000} fill="transparent" />

                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.tool === 'eraser' ? 'white' : (line.color || 'black')}
                            strokeWidth={line.size}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            hitStrokeWidth={25} // Hitbox for eraser
                            onMouseDown={(e) => handleLineClick(e, i)} // Eraser click
                            onTap={(e) => handleLineClick(e, i)}
                            onMouseEnter={() => {
                                if (mode === 'eraser' && eraserMode === 'stroke') {
                                    const container = stageRef.current?.container();
                                    if (container) container.style.cursor = 'crosshair';
                                }
                            }}
                            onMouseLeave={() => {
                                const container = stageRef.current?.container();
                                if (container) container.style.cursor = cursor;
                            }}
                        />
                    ))}

                    {shapes.map(shape => renderShape(shape))}

                    {textBoxes.map(box => (
                        !box.isEditing && (
                            <Text
                                key={box.id}
                                x={box.x}
                                y={box.y}
                                text={box.text}
                                fontSize={20}
                                draggable={mode !== 'text' && mode !== 'pen' && mode !== 'eraser'}
                                onDblClick={() => handleTextDblClick(box.id)}
                            />
                        )
                    ))}

                    {previewShape && renderShape(previewShape, true)}
                </Layer>
            </Stage>

            {/* Text Editing Overlay */}
            {textBoxes.map(box => (
                box.isEditing && (
                    <textarea
                        key={box.id}
                        value={box.text}
                        onChange={(e) => handleTextChange(box.id, e.target.value)}
                        onBlur={() => handleTextBlur(box.id)}
                        style={{
                            position: 'absolute',
                            top: box.y * scale + stagePos.y,
                            left: box.x * scale + stagePos.x,
                            fontSize: `${20 * scale}px`,
                            border: '1px dashed #ccc',
                            padding: '0px',
                            margin: 0,
                            background: 'transparent',
                            outline: 'none',
                            resize: 'none',
                            color: 'black',
                            fontFamily: 'sans-serif'
                        }}
                        autoFocus
                    />
                )
            ))}
        </div>
    );
}
