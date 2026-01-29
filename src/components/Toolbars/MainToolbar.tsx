
'use client';
import React from 'react';
import { Button } from '@/components/custom/button';
import { FaPen, FaEraser, FaFont, FaShapes, FaUndo, FaRedo, FaCircle, FaSquare, FaPlay, FaBars, FaStar, FaHeart, FaCloud, FaComment, FaGem, FaLongArrowAltRight, FaDrawPolygon, FaLine } from 'react-icons/fa';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MainToolbarProps {
    mode: 'pen' | 'text' | 'eraser' | 'shape';
    setMode: (mode: 'pen' | 'text' | 'eraser' | 'shape') => void;
    undo: () => void;
    redo: () => void;

    // New Props for detailed state
    selectedShape: 'rectangle' | 'circle' | 'triangle' | 'line' | 'star' | 'polygon' | 'arrow' | 'diamond' | 'bubble' | 'heart' | 'cloud';
    setSelectedShape: (shape: 'rectangle' | 'circle' | 'triangle' | 'line' | 'star' | 'polygon' | 'arrow' | 'diamond' | 'bubble' | 'heart' | 'cloud') => void;
    eraserMode: 'standard' | 'precise' | 'stroke';
    setEraserMode: (mode: 'standard' | 'precise' | 'stroke') => void;
    penSize: number;
    setPenSize: (size: number) => void;
    penColor: string;
    setPenColor: (color: string) => void;
}

export default function MainToolbar({
    mode, setMode, undo, redo,
    selectedShape, setSelectedShape,
    eraserMode, setEraserMode,
    penSize, setPenSize,
    penColor, setPenColor
}: MainToolbarProps) {
    // Helper for button classes to keep JSX clean
    const getButtonClass = (isActive: boolean) =>
        `transition-all duration-200 hover:scale-105 active:scale-95 ${isActive
            ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
            : 'hover:bg-gray-100 text-gray-900'
        }`;

    return (
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
            {/* Main Tools Container - Glassm effect */}
            <div className="flex gap-2 bg-white/80 backdrop-blur-xl shadow-2xl border border-white/40 p-2 rounded-2xl items-center ring-1 ring-black/5">

                {/* Pen Tool with Settings */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            onClick={() => setMode('pen')}
                            variant="ghost"
                            size="icon"
                            className={getButtonClass(mode === 'pen')}
                            title="Pen"
                        >
                            <FaPen className="w-4 h-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-4 bg-white/90 backdrop-blur-xl border-white/20 shadow-xl rounded-xl" align="start" sideOffset={10}>
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-gray-700">Pen Settings</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Thickness</span>
                                    <span>{penSize}px</span>
                                </div>
                                <input
                                    type="range" min="1" max="20"
                                    value={penSize}
                                    onChange={(e) => setPenSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                            <div className="flex gap-2 justify-between pt-1">
                                {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${penColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'border border-gray-200'}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setPenColor(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Eraser Tool with Modes */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            onClick={() => setMode('eraser')}
                            variant="ghost"
                            size="icon"
                            className={getButtonClass(mode === 'eraser')}
                            title="Eraser"
                        >
                            <FaEraser className="w-4 h-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-2 bg-white/90 backdrop-blur-xl border-white/20 shadow-xl rounded-xl" sideOffset={10}>
                        <div className="flex flex-col gap-1">
                            {[
                                { id: 'standard', label: 'Standard Eraser' },
                                { id: 'precise', label: 'Precise Eraser' },
                                { id: 'stroke', label: 'Stroke Eraser' }
                            ].map((item) => (
                                <Button
                                    key={item.id}
                                    variant="ghost"
                                    className={`justify-start h-9 text-sm font-medium transition-colors ${eraserMode === item.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                                    onClick={() => { setEraserMode(item.id as any); setMode('eraser'); }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <Button
                    onClick={() => setMode('text')}
                    variant="ghost"
                    size="icon"
                    className={getButtonClass(mode === 'text')}
                    title="Text"
                >
                    <FaFont className="w-4 h-4" />
                </Button>

                {/* Shape Tool Selector */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            onClick={() => setMode('shape')}
                            variant="ghost"
                            size="icon"
                            className={getButtonClass(mode === 'shape')}
                            title="Shapes"
                        >
                            <FaShapes className="w-4 h-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3 bg-white/90 backdrop-blur-xl border-white/20 shadow-xl rounded-xl" align="start" sideOffset={10}>
                        <div className="grid grid-cols-5 gap-2">
                            {[
                                { id: 'rectangle', icon: <FaSquare /> },
                                { id: 'circle', icon: <FaCircle /> },
                                { id: 'triangle', icon: <FaPlay className="-rotate-90" /> },
                                { id: 'line', icon: <FaLine /> },
                                { id: 'arrow', icon: <FaLongArrowAltRight /> },
                                { id: 'star', icon: <FaStar /> },
                                { id: 'diamond', icon: <FaGem /> },
                                { id: 'polygon', icon: <FaDrawPolygon /> },
                                { id: 'bubble', icon: <FaComment /> },
                                { id: 'heart', icon: <FaHeart /> },
                                { id: 'cloud', icon: <FaCloud /> },
                            ].map((shape) => (
                                <Button
                                    key={shape.id}
                                    variant="ghost"
                                    size="icon"
                                    className={`aspect-square hover:bg-blue-500 hover:text-white transition-colors ${selectedShape === shape.id ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                                    onClick={() => { setSelectedShape(shape.id as any); setMode('shape'); }}
                                    title={shape.id}
                                >
                                    {shape.icon}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

                <div className="flex gap-1">
                    <Button onClick={undo} variant="ghost" size="icon" className="hover:bg-gray-100 text-gray-700 transition-transform active:scale-90" title="Undo"><FaUndo className="w-4 h-4" /></Button>
                    <Button onClick={redo} variant="ghost" size="icon" className="hover:bg-gray-100 text-gray-700 transition-transform active:scale-90" title="Redo"><FaRedo className="w-4 h-4" /></Button>
                </div>
            </div>
        </div>
    );
}
