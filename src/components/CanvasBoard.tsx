
'use client'
import { Stage, Layer, Line, Text, Circle, Rect } from 'react-konva';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/custom/button';
import { FaPen, FaEraser, FaFont, FaTrash, FaPlus, FaArrowLeft, FaArrowRight, FaUndo, FaRedo, FaImage, FaMinus, FaShapes } from 'react-icons/fa';
import Konva from 'konva';
import { usePersistentState } from '@/hooks/usePersistentState';

interface LineData {
    points: number[];
    tool: 'pen' | 'eraser';
    size: number;
}

type ShapeType = 'circle' | 'rectangle' | 'line';

interface ShapeData {
    type: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    id: string;
    draggable?: boolean;
}
interface TextBoxData {
    x: number;
    y: number;
    text: string;
    id: string;
    draggable?: boolean;
    isEditing?: boolean;
}

export default function CanvasBoard({ noteId }: { noteId: string }) {
    const storageKey = `canvasNotes-${noteId}`;
    const [scale, setScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

    // Combined Persistent State
    const [canvasData, setCanvasData] = usePersistentState(storageKey, {
        lines: [[]] as LineData[][],
        textBoxes: [[]] as TextBoxData[][],
        shapes: [[]] as ShapeData[][]
    }, noteId);

    // Destructure for ease of use
    const lines = canvasData.lines || [[]];
    const textBoxes = canvasData.textBoxes || [[]];
    const shapes = canvasData.shapes || [[]];

    // Backward-compatible setters
    const setLines = useCallback((updater: LineData[][] | ((prev: LineData[][]) => LineData[][])) => {
        setCanvasData(prev => ({
            ...prev,
            lines: typeof updater === 'function' ? updater(prev.lines || [[]]) : updater
        }));
    }, [setCanvasData]);

    const setTextBoxes = useCallback((updater: TextBoxData[][] | ((prev: TextBoxData[][]) => TextBoxData[][])) => {
        setCanvasData(prev => ({
            ...prev,
            textBoxes: typeof updater === 'function' ? updater(prev.textBoxes || [[]]) : updater
        }));
    }, [setCanvasData]);

    const setShapes = useCallback((updater: ShapeData[][] | ((prev: ShapeData[][]) => ShapeData[][])) => {
        setCanvasData(prev => ({
            ...prev,
            shapes: typeof updater === 'function' ? updater(prev.shapes || [[]]) : updater
        }));
    }, [setCanvasData]);

    const [mode, setMode] = useState<'pen' | 'text' | 'eraser' | 'shape'>('pen');
    const [pageIndex, setPageIndex] = useState(0);
    const isDrawing = useRef(false);
    const [penSize, setPenSize] = useState(4);
    const undoStack = useRef<{ lines: LineData[][]; textBoxes: TextBoxData[][]; shapes: ShapeData[][] }[]>([]);
    const redoStack = useRef<{ lines: LineData[][]; textBoxes: TextBoxData[][]; shapes: ShapeData[][] }[]>([]);

    const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle'); // dropdown option
    const shapeStart = useRef<{ x: number; y: number } | null>(null);
    const stageRef = useRef<Konva.Stage | null>(null);
    const [cursor, setCursor] = useState('crosshair');
    const [previewShape, setPreviewShape] = useState<ShapeData | null>(null);

    const [stageSize, setStageSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1080,
        height: 1800
    });
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);

    const currentLines = lines[pageIndex] || [];
    const currentTextBoxes = textBoxes[pageIndex] || [];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedShapeId) {
                const updatedShapes = [...shapes];
                updatedShapes[pageIndex] = (shapes[pageIndex] || []).filter(
                    shape => shape.id !== selectedShapeId
                );
                setShapes(updatedShapes);
                setSelectedShapeId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedShapeId, shapes, pageIndex, setShapes]); // setShapes is stable but included for completeness

    useEffect(() => {
        document.title = "Note - Canvas"
    }, []);

    // Removed manual localStorage effect

    useEffect(() => {
        switch (mode) {
            case 'pen':
                setCursor('crosshair');
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
            default:
                setCursor('default');
        }
    }, [mode, penSize]);

    const pushUndo = () => {
        undoStack.current.push({
            lines: JSON.parse(JSON.stringify(lines)),
            textBoxes: JSON.parse(JSON.stringify(textBoxes)),
            shapes: JSON.parse(JSON.stringify(shapes))
        });
        redoStack.current = [];
    };

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;

        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isCtrlPressed = e.evt.ctrlKey;
        const deltaY = e.evt.deltaY;

        const scaleBy = 1.05;

        // 1. Handle zooming (pinch gesture or ctrl+scroll)
        if (isCtrlPressed || (isMac && e.evt.metaKey)) {
            const oldScale = scale;
            const direction = deltaY > 0 ? -1 : 1;
            let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

            newScale = Math.max(0.3, Math.min(5, newScale));

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
            return;
        }

        // 2. Handle two-finger pan (trackpad or shift+scroll)
        const dx = e.evt.deltaX;
        const dy = e.evt.deltaY;

        setStagePos(prev => ({
            x: prev.x - dx,
            y: prev.y - dy,
        }));
    };


    const undo = () => {
        if (undoStack.current.length === 0) return;
        redoStack.current.push({ lines, textBoxes, shapes });
        const last = undoStack.current.pop();
        if (last) {
            setLines(last.lines);
            setTextBoxes(last.textBoxes);
            setShapes(last.shapes);
        }
    };

    const redo = () => {
        if (redoStack.current.length === 0) return;
        undoStack.current.push({ lines, textBoxes, shapes });
        const next = redoStack.current.pop();
        if (next) {
            setLines(next.lines);
            setTextBoxes(next.textBoxes);
            setShapes(next.shapes);
        }
    };

    const handleTextClick = (id: string) => {
        const updated = [...textBoxes];
        updated[pageIndex] = currentTextBoxes.map((box) => ({
            ...box,
            isEditing: box.id === id
        }));
        setTextBoxes(updated);

        // Focus the text input if it exists
        setTimeout(() => {
            if (textInputRef.current) {
                textInputRef.current.focus();
                textInputRef.current.select();
            }
        }, 0);
    };

    const handleTextChange = (id: string, newText: string) => {
        const updated = [...textBoxes];
        updated[pageIndex] = currentTextBoxes.map((box) =>
            box.id === id ? { ...box, text: newText } : box
        );
        setTextBoxes(updated);
    };

    const handleTextBlur = () => {
        const updated = [...textBoxes];
        updated[pageIndex] = currentTextBoxes.map((box) => ({
            ...box,
            isEditing: false
        }));
        setTextBoxes(updated);
    };

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === e.target.getStage()) {
            setSelectedShapeId(null);
        }
        const stage = e.target.getStage();
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const pos = {
            x: (pointer.x - stage.x()) / stage.scaleX(),
            y: (pointer.y - stage.y()) / stage.scaleY(),
        };

        if (mode === 'shape') {
            shapeStart.current = { x: pos.x, y: pos.y };
        }

        if (mode === 'pen' || mode === 'eraser') {
            pushUndo();
            isDrawing.current = true;
            const updated = [...lines];
            const newLine = {
                points: [pos.x, pos.y],
                tool: mode,
                size: penSize
            };
            updated[pageIndex] = [...(currentLines || []), newLine];
            setLines(updated);
        } else if (mode === 'text') {
            // Only create new text box if we're not clicking on an existing one
            const clickedOnText = currentTextBoxes.some(box =>
                box.isEditing ||
                (pos.x >= box.x && pos.x <= box.x + 100 &&
                    pos.y >= box.y && pos.y <= box.y + 30)
            );

            if (!clickedOnText) {
                pushUndo();
                const updated = [...textBoxes];
                const newTextBox = {
                    x: pos.x,
                    y: pos.y,
                    text: 'Double click to edit',
                    id: Date.now().toString(),
                    isEditing: true
                };
                updated[pageIndex] = [...(currentTextBoxes || []), newTextBox];
                setTextBoxes(updated);

                // Focus the new text input
                setTimeout(() => {
                    if (textInputRef.current) {
                        textInputRef.current.focus();
                        textInputRef.current.select();
                    }
                }, 0);
            }
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const pos = {
            x: (pointer.x - stage.x()) / stage.scaleX(),
            y: (pointer.y - stage.y()) / stage.scaleY(),
        };

        // Handle pen/eraser drawing
        if (isDrawing.current && (mode === 'pen' || mode === 'eraser')) {
            const updated = [...lines];
            const current = [...(currentLines || [])];

            if (current.length === 0) return;

            const lastLine = { ...current[current.length - 1] };
            lastLine.points = [...lastLine.points, pos.x, pos.y];
            current[current.length - 1] = lastLine;
            updated[pageIndex] = current;
            setLines(updated);
        }

        // Handle shape preview while drawing
        if (mode === 'shape' && shapeStart.current) {
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
            });
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
        if (mode === 'shape' && shapeStart.current && previewShape) {
            pushUndo();
            const updatedShapes = [...shapes];
            updatedShapes[pageIndex] = [...(shapes[pageIndex] || []), {
                ...previewShape,
                id: Date.now().toString(),
            }];
            setShapes(updatedShapes);
            shapeStart.current = null;
            setPreviewShape(null);
        }
    };
    const handleClear = () => {
        pushUndo();
        const updatedLines = [...lines];
        const updatedText = [...textBoxes];
        const updatedShapes = [...shapes];
        updatedLines[pageIndex] = [];
        updatedText[pageIndex] = [];
        updatedShapes[pageIndex] = [];
        setLines(updatedLines);
        setTextBoxes(updatedText);
        setShapes(updatedShapes);
    };

    const handleDragText = (id: string, pos: { x: number; y: number }) => {
        const updated = [...textBoxes];
        updated[pageIndex] = (currentTextBoxes || []).map((box) =>
            box.id === id ? { ...box, x: pos.x, y: pos.y } : box
        );
        setTextBoxes(updated);
    };

    const addPage = () => {
        pushUndo();
        setLines([...lines, []]);
        setTextBoxes([...textBoxes, []]);
        setPageIndex(lines.length);
    };

    const prevPage = () => {
        if (pageIndex > 0) setPageIndex(pageIndex - 1);
    };

    const nextPage = () => {
        if (pageIndex < lines.length - 1) setPageIndex(pageIndex + 1);
    };

    const exportImage = () => {
        const stage = stageRef.current;
        if (!stage) return;

        const dataUrl = stage.toDataURL({
            mimeType: 'image/png',
            quality: 1,
        });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `note-page-${pageIndex + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    useEffect(() => {
        const handleResize = () => {
            setStageSize({
                width: window.innerWidth,
                height: window.innerWidth * (1800 / 1080)
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            className="p-4">
            <div className="fixed top-4 left-4 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    {/* Main toolbar */}
                    <div className="p-2 flex flex-wrap gap-1 max-w-xs">
                        {/* Tools section */}
                        <div className="flex gap-1 p-1 border-b border-gray-100">
                            <Button
                                onClick={() => setMode('pen')}
                                variant={mode === 'pen' ? 'secondary' : 'ghost'}
                                className="h-8 w-8 p-0"
                                title="Pen"
                            >
                                <FaPen className="text-sm" />
                            </Button>
                            <Button
                                onClick={() => setMode('eraser')}
                                variant={mode === 'eraser' ? 'secondary' : 'ghost'}

                                className="h-8 w-8 p-0"
                                title="Eraser"
                            >
                                <FaEraser className="text-sm" />
                            </Button>
                            <Button
                                onClick={() => setMode('text')}
                                variant={mode === 'text' ? 'secondary' : 'ghost'}

                                className="h-8 w-8 p-0"
                                title="Text"
                            >
                                <FaFont className="text-sm" />
                            </Button>
                        </div>

                        {/* Pen size controls */}
                        <div className="flex items-center gap-2 p-2 border-b border-gray-100">
                            <div className="flex-shrink-0 text-xs text-gray-500">Size</div>
                            <input
                                type="range"
                                min={1}
                                max={15}
                                value={penSize}
                                onChange={(e) => setPenSize(Number(e.target.value))}
                                className="w-20 h-1 rounded-full appearance-none bg-gray-200 accent-blue-500"
                            />
                            <div className="text-xs w-4 text-center">{penSize}</div>
                        </div>

                        {/* Page navigation */}
                        <div className="flex gap-1 p-1 border-b border-gray-100">
                            <Button
                                onClick={prevPage}
                                disabled={pageIndex === 0}

                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Previous page"
                            >
                                <FaArrowLeft className="text-sm" />
                            </Button>
                            <div className="flex items-center px-2 text-sm">
                                {pageIndex + 1}/{lines.length}
                            </div>
                            <Button
                                onClick={nextPage}
                                disabled={pageIndex === lines.length - 1}

                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Next page"
                            >
                                <FaArrowRight className="text-sm" />
                            </Button>
                            <Button
                                onClick={addPage}
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Add page"
                            >
                                <FaPlus color='black' className="text-sm" />
                            </Button>
                        </div>
                        <div className='flex gap-1 p-1'>
                            <Button
                                onClick={() => setMode('shape')}
                                variant={mode === 'shape' ? 'secondary' : 'ghost'}
                                // className="flex items-center gap-2"
                                className="h-8 w-8 p-0"
                            >
                                <FaShapes className="text-sm" />
                            </Button>
                            <select
                                value={selectedShape}
                                onChange={(e) => setSelectedShape(e.target.value as ShapeType)}
                                className="ml-2 border rounded p-1"
                            >
                                <option value="rectangle">Rectangle</option>
                                <option value="circle">Circle</option>
                                <option value="line">Line</option>
                            </select>
                            <Button
                                onClick={() => {
                                    if (selectedShapeId) {
                                        pushUndo();
                                        const updatedShapes = [...shapes];
                                        updatedShapes[pageIndex] = (shapes[pageIndex] || []).filter(
                                            shape => shape.id !== selectedShapeId
                                        );
                                        setShapes(updatedShapes);
                                        setSelectedShapeId(null);
                                    }
                                }}
                                disabled={!selectedShapeId}
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Delete selected shape"
                            >
                                <FaTrash className="text-sm" />
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 p-1">
                            <Button
                                onClick={undo}

                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Undo"
                            >
                                <FaUndo className="text-sm" />
                            </Button>
                            <Button
                                onClick={redo}

                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Redo"
                            >
                                <FaRedo className="text-sm" />
                            </Button>
                            <Button
                                onClick={handleClear}

                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Clear page"
                            >
                                <FaTrash className="text-sm" />
                            </Button>
                            <Button
                                onClick={exportImage}

                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Export"
                            >
                                <FaImage className="text-sm" />
                            </Button>
                        </div>

                        {/* Zoom controls */}
                        <div className="flex gap-1 p-1 border-t border-gray-100">
                            <Button
                                onClick={() => setScale(prev => Math.max(prev / 1.1, 0.3))}

                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Zoom Out"
                            >
                                <FaMinus className="text-sm" />
                            </Button>
                            <div className="flex items-center px-2 text-xs">
                                {Math.round(scale * 100)}%
                            </div>
                            <Button
                                onClick={() => setScale(prev => Math.min(prev * 1.1, 4))}
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Zoom In"
                            >
                                <FaPlus className="text-sm" />
                            </Button>
                            <Button
                                onClick={() => {
                                    setScale(1);
                                    setStagePos({ x: 0, y: 0 });
                                }}

                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Reset Zoom"
                            >
                                <span className="text-xs">1:1</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Stage
                ref={stageRef}
                height={stageSize.height}
                width={stageSize.width}
                scaleX={scale}
                scaleY={scale}
                x={stagePos.x}
                y={stagePos.y}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className=""
                style={{ cursor }}
            >
                <Layer>
                    {currentLines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.tool === 'eraser' ? '#fff' : '#000'}
                            strokeWidth={line.size}
                            tension={0.8}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                        />
                    ))}
                    {(shapes[pageIndex] || []).map((shape) => {
                        const isSelected = shape.id === selectedShapeId;
                        const someKey = shape.id;
                        const commonProps = {
                            draggable: true,
                            onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
                                e.cancelBubble = true; // Prevent event from reaching stage
                                setSelectedShapeId(shape.id);
                                setMode("pen")
                            },
                            onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
                                const updatedShapes = [...shapes];
                                updatedShapes[pageIndex] = (shapes[pageIndex] || []).map(s =>
                                    s.id === shape.id ? {
                                        ...s,
                                        x: e.target.x(),
                                        y: e.target.y()
                                    } : s
                                );
                                setShapes(updatedShapes);
                            },
                            stroke: isSelected ? 'blue' : 'black',
                            strokeWidth: isSelected ? 3 : 2,
                        };

                        if (shape.type === 'rectangle') {
                            return (
                                <Rect
                                    key={someKey}
                                    {...commonProps}
                                    x={shape.x}
                                    y={shape.y}
                                    width={shape.width}
                                    height={shape.height}
                                />
                            );
                        } else if (shape.type === 'circle') {
                            return (
                                <Circle
                                    key={someKey}
                                    {...commonProps}
                                    x={shape.x + shape.width / 2}
                                    y={shape.y + shape.height / 2}
                                    radius={Math.min(shape.width, shape.height) / 2}
                                />
                            );
                        } else if (shape.type === 'line') {
                            return (
                                <Line
                                    key={someKey}
                                    {...commonProps}
                                    points={[shape.x, shape.y, shape.x + shape.width, shape.y + shape.height]}
                                    lineCap="round"
                                />
                            );
                        }
                        return null;
                    })}
                    {currentTextBoxes.map((box) => (
                        box.isEditing ? (
                            <Text
                                key={box.id}
                                x={box.x}
                                y={box.y}
                                text={box.text}
                                fontSize={20}
                                fill="#000"
                                onClick={() => handleTextClick(box.id)}
                                onDblClick={() => handleTextClick(box.id)}
                            />
                        ) : (
                            <Text
                                key={box.id}
                                x={box.x}
                                y={box.y}
                                text={box.text}
                                fontSize={20}
                                fill="#000"
                                draggable
                                onClick={() => handleTextClick(box.id)}
                                onDblClick={() => handleTextClick(box.id)}
                                onDragEnd={(e) =>
                                    handleDragText(box.id, {
                                        x: e.target.x(),
                                        y: e.target.y(),
                                    })
                                }
                            />
                        )
                    ))}

                    {previewShape && (
                        previewShape.type === 'rectangle' ? (
                            <Rect
                                x={previewShape.x}
                                y={previewShape.y}
                                width={previewShape.width}
                                height={previewShape.height}
                                stroke="gray"
                                strokeWidth={2}
                                dash={[10, 5]}
                            />
                        ) : previewShape.type === 'circle' ? (
                            <Circle
                                x={previewShape.x + previewShape.width / 2}
                                y={previewShape.y + previewShape.height / 2}
                                radius={Math.min(previewShape.width, previewShape.height) / 2}
                                stroke="gray"
                                strokeWidth={2}
                                dash={[10, 5]}
                            />
                        ) : previewShape.type === 'line' ? (
                            <Line
                                points={[
                                    previewShape.x,
                                    previewShape.y,
                                    previewShape.x + previewShape.width,
                                    previewShape.y + previewShape.height
                                ]}
                                stroke="gray"
                                strokeWidth={2}
                                dash={[10, 5]}
                                lineCap="round"
                            />
                        ) : null
                    )}
                </Layer>
            </Stage>
            {/* Hidden Text Area for Input */}
            {currentTextBoxes.some(b => b.isEditing) && (
                <textarea
                    ref={textInputRef}
                    style={{
                        position: 'absolute',
                        top: -1000,
                        left: -1000,
                        opacity: 0,
                    }}
                    value={
                        currentTextBoxes.find(b => b.isEditing)?.text || ''
                    }
                    onChange={(e) => {
                        const box = currentTextBoxes.find(b => b.isEditing);
                        if (box) handleTextChange(box.id, e.target.value);
                    }}
                    onBlur={handleTextBlur}
                />
            )}
        </div>
    );
}