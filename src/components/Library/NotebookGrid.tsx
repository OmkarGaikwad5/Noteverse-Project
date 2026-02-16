'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiPlus, FiGrid, FiList, FiSearch, FiUser, 
  FiCalendar, FiEdit3, FiTrash2, FiMoreVertical,
  FiFileText, FiImage, FiFolder, FiClock,
  FiChevronRight, FiStar, FiShare2, FiX
} from 'react-icons/fi';
import { 
  FaPalette, FaBook, FaPenFancy, FaRegStar,
  FaSortAmountDown, FaRegClock
} from 'react-icons/fa';
import { BsBrush, BsCardText, BsGrid3X3 } from 'react-icons/bs';

interface Notebook {
  _id: string;
  title: string;
  coverColor: string;
  updatedAt: string;
  type?: 'canvas' | 'note';
  description?: string;
  pages?: number;
  isStarred?: boolean;
  lastAccessed?: string;
}

// Type for sorting options
type SortBy = 'recent' | 'name' | 'type';
type FilterType = 'all' | 'canvas' | 'note';

export default function NotebookGrid() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [filteredNotebooks, setFilteredNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'canvas' | 'note'>('canvas');
  const [newDescription, setNewDescription] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    canvas: 0,
    note: 0,
    lastUpdated: ''
  });

  // Fetch notebooks
  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        // Get user data
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error("Not authenticated");
        const userData = await res.json();

        // Fetch notebooks
        const resNotes = await fetch(`/api/v2/notebooks?userId=${userData.user.id}`);
        const data = await resNotes.json();
        const notebooksData = data.notebooks || [];
        
        // Format notebooks with additional data
        const formattedNotebooks = notebooksData.map((nb: Notebook) => ({
          ...nb,
          description: nb.description || `A ${nb.type === 'canvas' ? 'whiteboard' : 'text'} notebook`,
          pages: nb.type === 'canvas' ? Math.floor(Math.random() * 20) + 1 : Math.floor(Math.random() * 50) + 1,
          isStarred: Math.random() > 0.7,
          lastAccessed: new Date(nb.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        setNotebooks(formattedNotebooks);
        setFilteredNotebooks(formattedNotebooks);
        
        // Calculate stats
        const canvasCount = formattedNotebooks.filter((n: Notebook) => n.type === 'canvas').length;
        const noteCount = formattedNotebooks.filter((n: Notebook) => n.type === 'note').length;
        const lastUpdated = formattedNotebooks.length > 0 
          ? new Date(formattedNotebooks[0].updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Never';

        setStats({
          total: formattedNotebooks.length,
          canvas: canvasCount,
          note: noteCount,
          lastUpdated
        });
      } catch (e) {
        console.error("Failed to fetch notebooks", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotebooks();
  }, []);

  // Filter and sort notebooks
  useEffect(() => {
    let filtered = [...notebooks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(nb =>
        nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (nb.description && nb.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(nb => nb.type === filterType);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'type':
        filtered.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    setFilteredNotebooks(filtered);
  }, [searchQuery, filterType, sortBy, notebooks]);

  const handleCreateClick = () => {
    setNewTitle('');
    setNewDescription('');
    setNewType('canvas');
    setIsCreating(true);
  };

  const confirmCreate = async () => {
    if (!newTitle.trim()) return;

    try {
      const resAuth = await fetch('/api/auth/me');
      if (!resAuth.ok) return;
      const userData = await resAuth.json();

      const res = await fetch('/api/v2/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user.id,
          title: newTitle,
          description: newDescription,
          coverColor: newType === 'canvas' ? '#6366F1' : '#10B981', // Indigo for canvas, Emerald for note
          type: newType
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newNotebook = {
          ...data.notebook,
          description: newDescription,
          pages: 1,
          isStarred: false,
          lastAccessed: 'Now'
        };
        
        setNotebooks([newNotebook, ...notebooks]);
        setIsCreating(false);
        setNewTitle('');
        setNewDescription('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStarClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotebooks(notebooks.map(nb =>
      nb._id === id ? { ...nb, isStarred: !nb.isStarred } : nb
    ));
  };

  const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this notebook?')) {
      try {
        const res = await fetch(`/api/v2/notebooks/${id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          setNotebooks(notebooks.filter(nb => nb._id !== id));
        }
      } catch (e) {
        console.error('Failed to delete notebook', e);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type: 'canvas' | 'note' | undefined) => {
    return type === 'canvas' ? 
      <BsBrush className="text-indigo-500" /> : 
      <BsCardText className="text-emerald-500" />;
  };

  const getTypeColor = (type: 'canvas' | 'note' | undefined) => {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i: number) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i: number) => (
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notebook Library</h1>
              <p className="text-gray-600 mt-1 text-sm">
                {stats.total} notebooks • Last updated {stats.lastUpdated}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/profile')}
                className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
                title="Profile"
              >
                <FiUser className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleCreateClick}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm"
              >
                <FiPlus className="w-4 h-4" />
                New Notebook
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium mb-1">Total Notebooks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-blue-600 text-xs mt-2">All your creative works</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FaBook className="text-white text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-700 text-sm font-medium mb-1">Canvas Boards</p>
                <p className="text-3xl font-bold text-gray-900">{stats.canvas}</p>
                <p className="text-indigo-600 text-xs mt-2">Whiteboard & drawings</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BsBrush className="text-white text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm font-medium mb-1">Text Notes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.note}</p>
                <p className="text-emerald-600 text-xs mt-2">Documents & writings</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <FiFileText className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notebooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all w-full sm:w-64"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('canvas')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterType === 'canvas' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Canvas
              </button>
              <button
                onClick={() => setFilterType('note')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterType === 'note' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
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
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="recent">Recently Updated</option>
                <option value="name">Name (A-Z)</option>
                <option value="type">Type</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Notebooks Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotebooks.map((notebook) => {
              const typeColors = getTypeColor(notebook.type);
              return (
                <div
                  key={notebook._id}
                  onClick={() => router.push(`/notebook/${notebook._id}`)}
                  className="group cursor-pointer bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}>
                      {getTypeIcon(notebook.type)}
                      <span>{notebook.type === 'canvas' ? 'Canvas' : 'Note'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleStarClick(notebook._id, e)}
                        className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                        type="button"
                      >
                        {notebook.isStarred ? (
                          <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <FiStar className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(notebook._id, e);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Notebook"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" type="button">
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className={`h-32 mb-4 rounded-lg flex items-center justify-center ${typeColors.bg} ${typeColors.border} border-2`}>
                    <div className="text-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${notebook.type === 'canvas' ? 'from-indigo-500 to-indigo-600' : 'from-emerald-500 to-emerald-600'} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        {getTypeIcon(notebook.type)}
                      </div>
                      <span className={`text-sm font-medium ${typeColors.text}`}>
                        {notebook.type === 'canvas' ? 'Whiteboard' : 'Text Document'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{notebook.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{notebook.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-3 h-3" />
                      <span>{formatDate(notebook.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiFileText className="w-3 h-3" />
                      <span>{notebook.pages} pages</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filteredNotebooks.map((notebook) => {
              const typeColors = getTypeColor(notebook.type);
              return (
                <div
                  key={notebook._id}
                  onClick={() => router.push(`/notebook/${notebook._id}`)}
                  className="group flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer last:border-b-0"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeColors.bg}`}>
                    {getTypeIcon(notebook.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{notebook.title}</h3>
                      {notebook.isStarred && (
                        <FiStar className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm truncate">{notebook.description}</p>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}>
                      {notebook.type === 'canvas' ? 'Canvas' : 'Note'}
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {formatDate(notebook.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FiFileText className="w-3 h-3" />
                      {notebook.pages} pages
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStarClick(notebook._id, e)}
                      className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      {notebook.isStarred ? (
                        <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <FiStar className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(notebook._id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <FiChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredNotebooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
              <FaBook className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No notebooks found</h3>
            <p className="text-gray-600 text-sm max-w-md mb-6">
              {searchQuery 
                ? `No notebooks match "${searchQuery}". Try a different search term.`
                : 'Create your first notebook to start capturing ideas and notes.'}
            </p>
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Create Your First Notebook
            </button>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Notebook</h2>
                <p className="text-gray-600 text-sm mt-1">Start fresh with a new canvas or note</p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-gray-500 text-lg" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Notebook Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter notebook title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of your notebook..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Notebook Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewType('canvas')}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${newType === 'canvas'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-2">
                      <BsBrush className="text-white text-lg" />
                    </div>
                    <div className="text-sm font-semibold">Canvas</div>
                    <div className="text-xs text-gray-500 mt-1">Whiteboard & Drawings</div>
                  </button>

                  <button
                    onClick={() => setNewType('note')}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${newType === 'note'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-2">
                      <FiFileText className="text-white text-lg" />
                    </div>
                    <div className="text-sm font-semibold">Note</div>
                    <div className="text-xs text-gray-500 mt-1">Text & Documents</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCreate}
                  disabled={!newTitle.trim()}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    !newTitle.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg cursor-pointer'
                  }`}
                >
                  Create Notebook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}