import React from 'react';
import { FaPen, FaBook } from 'react-icons/fa';

interface Prop {
  onSelectMode: (mode: 'canvas' | 'notebook') => void;
}

function NoteOptions({ onSelectMode }: Prop) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="px-4 py-6 md:p-6 overflow-y-auto max-h-[80vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Canvas Card */}
          <div
            onClick={() => onSelectMode('canvas')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMode('canvas')}
            className="cursor-pointer bg-white dark:bg-card rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center text-royal-blue dark:text-royal-blue border border-border hover:ring-2 hover:ring-royal-blue/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-royal-blue/50"
          >
            <div className="text-[4rem] mb-4 drop-shadow text-royal-blue dark:text-royal-blue">
              <FaPen />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">Canvas Board</h2>
            <p className="text-center text-sm text-slate-gray dark:text-slate-gray/80 max-w-md mb-4 font-medium">
              Draw, sketch, or diagram ideas with pen tools, shapes, and gesture-based auto recognition.
            </p>
            <ul className="list-disc list-inside text-royal-blue/90 dark:text-royal-blue/80 text-left text-sm max-w-md space-y-1 font-medium mb-6">
              <li>Smooth pen and eraser tools</li>
              <li>Shape detection with live preview</li>
              <li>Multiple canvas pages with undo/redo</li>
              <li>Export to image files</li>
            </ul>
            <button
              className="bg-royal-blue hover:bg-royal-blue/90 text-white rounded-xl px-6 py-2 font-semibold shadow-md transition"
              aria-label="Start Drawing"
            >
              Start Drawing
            </button>
          </div>

          {/* Notebook Card */}
          <div
            onClick={() => onSelectMode('notebook')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMode('notebook')}
            className="cursor-pointer bg-white dark:bg-card rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center text-forest-green dark:text-forest-green border border-border hover:ring-2 hover:ring-forest-green/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-green/50"
          >
            <div className="text-[4rem] mb-4 drop-shadow text-forest-green dark:text-forest-green">
              <FaBook />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">Notebook</h2>
            <p className="text-center text-sm text-slate-gray dark:text-slate-gray/80 max-w-md mb-4 font-medium">
              Use structured line-by-line editing or full-page notes. Best for organized documentation.
            </p>
            <ul className="list-disc list-inside text-forest-green/90 dark:text-forest-green/80 text-left text-sm max-w-md space-y-1 font-medium mb-6">
              <li>Line-by-line or full-page editing</li>
              <li>Auto-saving locally as you type</li>
              <li>Easy page flipping and organization</li>
              <li>Switch between layouts instantly</li>
            </ul>
            <button
              className="bg-forest-green hover:bg-forest-green/90 text-white rounded-xl px-6 py-2 font-semibold shadow-md transition"
              aria-label="Start Writing"
            >
              Start Writing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteOptions;
