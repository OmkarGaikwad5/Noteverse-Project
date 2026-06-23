'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiGrid, FiList, FiSearch, FiUser, 
  FiFileText, FiClock, FiX, FiRefreshCw, FiTrash2, FiUpload, FiGlobe
} from 'react-icons/fi';
import { FaBook, FaSortAmountDown } from 'react-icons/fa';
import { BsBrush, BsCardText } from 'react-icons/bs';
import { useToast } from '@/hooks/useToast';

interface LibraryItem {
  _id: string;
  noteId: string;
  title: string;
  type: 'canvas' | 'note';
  content?: any;
  importedAt: string;
}

interface PublicNote {
  id: string;
  title: string;
  type: 'canvas' | 'note';
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

type SortBy = 'recent' | 'name';
type FilterType = 'all' | 'canvas' | 'note';

export default function LibraryPage() {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [publicNotes, setPublicNotes] = useState<PublicNote[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Fetch library items (imported notes)
  const fetchLibrary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/library/list');
      if (!res.ok) throw new Error("Failed to fetch library");
      const data = await res.json();
      setLibraryItems(data.library || []);
    } catch (e) {
      console.error("Failed to fetch library", e);
      toast.error({ title: "Failed to load library" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch public notes from all users
  const fetchPublicNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes/public');
      if (!res.ok) throw new Error("Failed to fetch public notes");
      const data = await res.json();
      // Convert 'notebook' to 'note' for consistency
      const notes = (data.notes || []).map((note: any) => ({
        ...note,
        type: note.type === 'notebook' ? 'note' : note.type
      }));
      setPublicNotes(notes);
    } catch (e) {
      console.error("Failed to fetch public notes", e);
      toast.error({ title: "Failed to load public notes" });
    }
  }, [toast]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Filter and sort library items
  useEffect(() => {
    let filtered = [...libraryItems];

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filtered.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
    }

    setFilteredItems(filtered);
  }, [searchQuery, filterType, sortBy, libraryItems]);

  const handleImportNotes = async () => {
    if (selectedNotes.size === 0) {
      toast.info({ title: "Select notes", description: "Please select at least one note to import." });
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const noteId of Array.from(selectedNotes)) {
        const res = await fetch('/api/library/import/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId })
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success({ 
          title: "Import complete", 
          description: `Successfully imported ${successCount} note(s) to your library.` 
        });
        await fetchLibrary();
        setSelectedNotes(new Set());
        setShowImportModal(false);
      }
      if (failCount > 0) {
        toast.error({ title: "Partial import", description: `${failCount} note(s) failed to import.` });
      }
    } catch (e) {
      console.error("Import failed", e);
      toast.error({ title: "Import failed", description: "Please try again." });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteFromLibrary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this note from Library?")) return;

    setDeletingId(id);
    
    try {
      let response = await fetch(`/api/library/${id}`, { method: 'DELETE' });
      
      if (response.status === 404) {
        response = await fetch('/api/library/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data.success) {
        await fetchLibrary();
        toast.success({ title: "Removed", description: "Note removed from Library." });
      } else {
        throw new Error(data.error || "Delete failed");
      }
    } catch (e) {
      console.error("Delete failed", e);
      toast.error({ title: "Failed", description: "Could not remove from library." });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelectNote = (noteId: string) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Unknown date';
    }
  };

  const getTypeIcon = (type: 'canvas' | 'note') => {
    return type === 'canvas' ? <BsBrush className="text-indigo-500" /> : <BsCardText className="text-emerald-500" />;
  };

  const getTypeColor = (type: 'canvas' | 'note') => {
    return type === 'canvas' 
      ? { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' }
      : { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Library</h1>
              <p className="text-gray-600 mt-1 text-sm">
                {libraryItems.length} item(s) in your library
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchLibrary()}
                className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
                title="Refresh"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={async () => {
                  await fetchPublicNotes();
                  setShowImportModal(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105 text-sm"
              >
                <FiUpload className="w-4 h-4" />
                Import Notes
              </button>
              
              <button
                onClick={() => router.push('/profile')}
                className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
                title="Profile"
              >
                <FiUser className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-64"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-sm rounded-md ${filterType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('canvas')}
                className={`px-3 py-1.5 text-sm rounded-md ${filterType === 'canvas' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-600'}`}
              >
                Canvas
              </button>
              <button
                onClick={() => setFilterType('note')}
                className={`px-3 py-1.5 text-sm rounded-md ${filterType === 'note' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-600'}`}
              >
                Notes
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FaSortAmountDown className="text-gray-400 w-4 h-4" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="recent">Recently Added</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Library Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
              <FaBook className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Library is empty</h3>
            <p className="text-gray-600 text-sm max-w-md mb-6">
              Click "Import Notes" to discover and import public notes from other creators.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const typeColors = getTypeColor(item.type);
              const isDeleting = deletingId === item._id;
              return (
                <div
                  key={item._id}
                  onClick={() => !isDeleting && router.push(`/note/${item.noteId}?mode=${item.type === 'canvas' ? 'canvas' : 'notebook'}`)}
                  className={`group cursor-pointer bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all hover:scale-[1.02] ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}>
                      {getTypeIcon(item.type)}
                      <span>{item.type === 'canvas' ? 'Canvas' : 'Note'}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFromLibrary(item._id, e)}
                      disabled={isDeleting}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Remove from Library"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`h-32 mb-4 rounded-lg flex items-center justify-center ${typeColors.bg} ${typeColors.border} border-2`}>
                    <div className="text-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${item.type === 'canvas' ? 'from-indigo-500 to-indigo-600' : 'from-emerald-500 to-emerald-600'} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <span className={`text-sm font-medium ${typeColors.text}`}>
                        {item.type === 'canvas' ? 'Canvas Board' : 'Notebook'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-3 h-3" />
                      <span>Added {formatDate(item.importedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filteredItems.map((item) => {
              const typeColors = getTypeColor(item.type);
              const isDeleting = deletingId === item._id;
              return (
                <div
                  key={item._id}
                  onClick={() => !isDeleting && router.push(`/note/${item.noteId}?mode=${item.type === 'canvas' ? 'canvas' : 'notebook'}`)}
                  className={`group flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer last:border-b-0 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeColors.bg}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors.bg} ${typeColors.text}`}>
                        {item.type === 'canvas' ? 'Canvas' : 'Note'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Added {formatDate(item.importedAt)}</p>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteFromLibrary(item._id, e)}
                    disabled={isDeleting}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Import Notes Modal - Select public notes to import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Import Public Notes</h2>
                <p className="text-gray-600 text-sm mt-1">Select notes from other creators to add to your library</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500 text-lg" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {publicNotes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiGlobe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No public notes available to import.</p>
                  <p className="text-sm mt-2">Make your notes public so others can discover them!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => toggleSelectNote(note.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedNotes.has(note.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${note.type === 'canvas' ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
                        {note.type === 'canvas' ? <BsBrush className="text-indigo-600" /> : <BsCardText className="text-emerald-600" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{note.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${note.type === 'canvas' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {note.type === 'canvas' ? 'Canvas' : 'Note'}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FiUser className="w-3 h-3" />
                            {note.author.name}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedNotes.has(note.id)
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedNotes.has(note.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImportNotes}
                disabled={selectedNotes.size === 0 || importing}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  selectedNotes.size === 0 || importing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                }`}
              >
                {importing ? `Importing (${selectedNotes.size})...` : `Import ${selectedNotes.size} Note(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}