import React from 'react';
import { FaPen, FaBook, FaPalette, FaFileAlt, FaPaintBrush, FaEdit, FaArrowRight } from 'react-icons/fa';

interface Prop {
  onSelectMode: (mode: 'canvas' | 'notebook') => void;
}

function NoteOptions({ onSelectMode }: Prop) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="px-4 py-6 md:p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Create New Note</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose a format that matches your creative flow. Both options sync automatically across your devices.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Canvas Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transform transition-all duration-300 hover:shadow-xl group">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <FaPalette className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Canvas Board</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      For Creatives
                    </span>
                    <span className="text-sm text-gray-500">Freeform drawing</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                Draw, sketch, and diagram ideas with advanced drawing tools. Perfect for visual thinkers, designers, and anyone who thinks better with visuals.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaPaintBrush className="text-blue-600 text-xs" />
                  </div>
                  <span className="text-gray-700 font-medium">Advanced pen & brush tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700 font-medium">Shape recognition & drawing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Export as high-quality images</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Unlimited undo/redo</span>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => onSelectMode('canvas')}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group-hover:from-blue-700 group-hover:to-cyan-700"
                aria-label="Start Drawing on Canvas"
              >
                Start Drawing
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Decorative Border */}
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          </div>

          {/* Notebook Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transform transition-all duration-300 hover:shadow-xl group">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <FaFileAlt className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Notebook</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      For Writers
                    </span>
                    <span className="text-sm text-gray-500">Structured writing</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                Write, organize, and structure your thoughts with rich text editing. Perfect for notes, documentation, journals, and organized content.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaEdit className="text-purple-600 text-xs" />
                  </div>
                  <span className="text-gray-700 font-medium">Rich text editing with formatting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Line-by-line or full-page modes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Auto-saving as you type</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Easy organization & navigation</span>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => onSelectMode('notebook')}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group-hover:from-purple-700 group-hover:to-pink-700"
                aria-label="Start Writing in Notebook"
              >
                Start Writing
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Decorative Border */}
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-10 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Both options include: <span className="font-medium text-gray-700">Auto-sync</span> • 
            <span className="font-medium text-gray-700 ml-2">Cloud backup</span> • 
            <span className="font-medium text-gray-700 ml-2">Collaboration ready</span> • 
            <span className="font-medium text-gray-700 ml-2">Export options</span>
          </p>
          <p className="text-gray-400 text-xs mt-2">
            You can always switch formats later
          </p>
        </div>
      </div>
    </div>
  );
}

export default NoteOptions;