'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaPen, FaBook } from 'react-icons/fa';


export default function Page() {
  const [selectedMode, setSelectedMode] = useState<'canvas' | 'notebook' | null>(null);
  const router = useRouter();
  

  useEffect(() => {
      if (selectedMode === 'canvas') return router.push('/canvas');
      if (selectedMode === 'notebook') return router.push('/notebook');
  }, [selectedMode, router])

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="max-w-5xl mx-auto p-10 text-center">
        <h1 className="text-5xl font-extrabold text-royal-blue dark:text-royal-blue mb-4 drop-shadow-sm tracking-tight select-none">
          Welcome to NoteMaster
        </h1>
        <p className="text-xl font-medium text-slate-gray dark:text-slate-gray/80 max-w-2xl mx-auto">
          Choose your preferred note-taking mode — canvas for freeform ideas or notebook for structured writing.
        </p>
      </header>

      {/* Mode Cards */}
      <main className="flex-grow flex justify-center items-center px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl w-full">
          {/* Canvas Board Card */}
          <div
            onClick={() => setSelectedMode('canvas')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedMode('canvas')}
            className="cursor-pointer bg-white dark:bg-card rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-10 flex flex-col items-center text-royal-blue dark:text-royal-blue border border-border hover:ring-2 hover:ring-royal-blue/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-royal-blue/50"
          >
            <div className="text-[6rem] mb-6 drop-shadow text-royal-blue dark:text-royal-blue">
              <FaPen />
            </div>
            <h2 className="text-3xl font-bold mb-3 select-none">Canvas Board</h2>
            <p className="text-center text-slate-gray dark:text-slate-gray/80 max-w-md mb-6 font-medium">
              Draw, sketch, or diagram ideas with pen tools, shapes, and gesture-based auto recognition. Ideal for visual thinkers.
            </p>
            <ul className="list-disc list-inside text-royal-blue/90 dark:text-royal-blue/80 text-left max-w-md space-y-1 font-medium mb-8">
              <li>Smooth pen and eraser tools</li>
              <li>Shape detection with live preview</li>
              <li>Multiple canvas pages with undo/redo</li>
              <li>Export to image files</li>
            </ul>
            <button
              className="bg-royal-blue hover:bg-royal-blue/90 text-white dark:text-white rounded-xl px-10 py-3 font-semibold tracking-wide shadow-md transition"
              aria-label="Start Drawing"
            >
              Start Drawing
            </button>
          </div>

          {/* Notebook Card */}
          <div
            onClick={() => setSelectedMode('notebook')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedMode('notebook')}
            className="cursor-pointer bg-white dark:bg-card rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-10 flex flex-col items-center text-forest-green dark:text-forest-green border border-border hover:ring-2 hover:ring-forest-green/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-green/50"
          >
            <div className="text-[6rem] mb-6 drop-shadow text-forest-green dark:text-forest-green">
              <FaBook />
            </div>
            <h2 className="text-3xl font-bold mb-3 select-none">Notebook</h2>
            <p className="text-center text-slate-gray dark:text-slate-gray/80 max-w-md mb-6 font-medium">
              Use structured line-by-line editing or full-page notes. Best for organized documentation and traditional writing.
            </p>
            <ul className="list-disc list-inside text-forest-green/90 dark:text-forest-green/80 text-left max-w-md space-y-1 font-medium mb-8">
              <li>Line-by-line or full-page editing</li>
              <li>Auto-saving locally as you type</li>
              <li>Easy page flipping and organization</li>
              <li>Switch between layouts instantly</li>
            </ul>
            <button
              className="bg-forest-green hover:bg-forest-green/90 text-white dark:text-white rounded-xl px-10 py-3 font-semibold tracking-wide shadow-md transition"
              aria-label="Start Writing"
            >
              Start Writing
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-6 text-center bg-slate-gray/10 dark:bg-slate-gray/20 text-slate-gray dark:text-slate-gray text-sm font-medium tracking-wide">
        <p className="max-w-3xl mx-auto px-4">
          Your notes are saved in your browser. Switch modes any time by refreshing this page. No internet required.
        </p>
      </footer>
    </div>
  );
}
