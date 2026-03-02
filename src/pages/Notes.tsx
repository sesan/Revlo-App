import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import BottomNav from '../components/BottomNav';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { format } from 'date-fns';

type FilterType = 'All' | 'Highlights' | 'Notes' | 'Journal' | 'Voice' | 'Bookmarks';

export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollDirection = useScrollDirection();
  const [notes, setNotes] = useState<any[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, activeFilter]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          content,
          type,
          framework,
          tags,
          created_at,
          book,
          chapter,
          verse
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      
      // Extract unique tags
      const tags = new Set<string>();
      data?.forEach((note: any) => {
        note.tags?.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
      
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let result = notes;

    // Apply type filter
    if (activeFilter !== 'All') {
      const typeMap: Record<string, string> = {
        'Highlights': 'highlight',
        'Notes': 'note',
        'Journal': 'journal',
        'Voice': 'voice',
        'Bookmarks': 'bookmark'
      };
      result = result.filter(n => n.type === typeMap[activeFilter]);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => {
        const contentMatch = n.content?.toLowerCase().includes(query);
        const tagMatch = n.tags?.some((t: string) => t.toLowerCase().includes(query));
        const refMatch = `${n.book} ${n.chapter}:${n.verse}`.toLowerCase().includes(query);
        return contentMatch || tagMatch || refMatch;
      });
    }

    // Apply tag filter
    if (selectedTag) {
      result = result.filter(n => n.tags?.includes(selectedTag));
    }

    setFilteredNotes(result);
  };

  const handleAddTag = async (noteId: string, currentTags: string[]) => {
    const tag = window.prompt('Enter a tag:');
    if (!tag || !tag.trim()) return;
    
    const newTag = tag.trim();
    if (currentTags?.includes(newTag)) return;
    
    const updatedTags = [...(currentTags || []), newTag];
    
    try {
      const { error } = await supabase
        .from('notes')
        .update({ tags: updatedTags })
        .eq('id', noteId);
        
      if (error) throw error;
      
      // Update local state
      const updatedNotes = notes.map(n => 
        n.id === noteId ? { ...n, tags: updatedTags } : n
      );
      setNotes(updatedNotes);
      
      // Update allTags if new tag
      if (!allTags.includes(newTag)) {
        setAllTags([...allTags, newTag].sort());
      }
    } catch (err) {
      console.error('Error adding tag:', err);
      alert('Failed to add tag');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'highlight': return 'bg-bg-hover text-text-primary';
      case 'note': return 'bg-bg-hover text-text-primary';
      case 'journal': return 'bg-gold-subtle text-gold';
      case 'voice': return 'bg-bg-hover text-text-primary';
      default: return 'bg-border text-text-muted';
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <span key={i} className="bg-gold/25 text-text-primary">{part}</span> : part
    );
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col pb-[80px]">
      <div className="flex-1 max-w-[600px] mx-auto w-full px-4 py-6">
        <h1 className="font-bold tracking-tighter text-[26px] text-text-primary mb-6">My Notes</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input
            type="text"
            placeholder="Search verses, notes, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-input border border-border rounded-full py-3.5 pl-12 pr-4 text-[15px] text-text-primary focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['All', 'Highlights', 'Notes', 'Journal', 'Voice', 'Bookmarks'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border ${
                  activeFilter === filter
                    ? 'bg-gold text-text-inverse border-gold'
                    : 'bg-transparent text-gold border-gold-border hover:bg-gold/10'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          
          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-[11px] text-text-muted self-center mr-1">Tags:</span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  selectedTag === null
                    ? 'bg-text-secondary text-text-inverse border-text-secondary'
                    : 'bg-transparent text-text-secondary border-border hover:bg-bg-hover'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                    selectedTag === tag
                      ? 'bg-text-secondary text-text-inverse border-text-secondary'
                      : 'bg-transparent text-text-secondary border-border hover:bg-bg-hover'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes Feed */}
        {loading ? (
          <div className="text-center py-10 text-text-muted">Loading...</div>
        ) : filteredNotes.length > 0 ? (
          <div className="space-y-3">
            {filteredNotes.map((note) => {
              const isExpanded = expandedNoteId === note.id;
              
              return (
                <div
                  key={note.id}
                  onClick={() => note.book && note.chapter ? navigate(`/bible/${note.book}/${note.chapter}${note.verse ? `?verse=${note.verse}` : ''}`) : undefined}
                  className="bg-bg-surface border border-border rounded-2xl p-4 cursor-pointer hover:bg-bg-hover transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-medium text-gold">
                      {note.book} {note.chapter}{note.verse ? `:${note.verse}` : ''}
                    </span>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize ${getTypeColor(note.type)}`}>
                      {note.type}
                    </span>
                  </div>

                  <div className={`text-[14px] text-text-secondary mt-2 mb-3 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {note.content ? highlightText(note.content, searchQuery) : 'No content'}
                  </div>

                  <div className="flex justify-between items-center mt-auto pt-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {note.tags?.map((tag: string) => (
                        <span 
                          key={tag} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }}
                          className={`bg-bg-elevated border border-border text-[11px] px-2 py-0.5 rounded-full hover:border-gold hover:text-gold transition-colors ${selectedTag === tag ? 'border-gold text-gold' : 'text-text-muted'}`}
                        >
                          #{tag}
                        </span>
                      ))}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleAddTag(note.id, note.tags);
                        }}
                        className="bg-bg-elevated border border-border text-text-muted hover:text-gold text-[11px] px-2 py-0.5 rounded-full flex items-center"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-text-muted">
                        {format(new Date(note.created_at), 'MMM d')}
                      </span>
                      <button
                        onClick={(e) => handleDelete(note.id, e)}
                        className="text-text-muted hover:text-error transition-colors p-1"
                        aria-label="Delete note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="text-center pt-4">
              <button className="text-[14px] text-gold hover:underline font-medium">
                Load more
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={48} className="text-text-muted mb-4" />
            <h2 className="font-bold tracking-tighter text-[22px] text-text-primary mb-2">
              Your Bible study memory starts here.
            </h2>
            <p className="text-[14px] text-text-secondary max-w-[280px] mb-8">
              Everything you highlight, write, or record will live here — searchable, forever.
            </p>
            <button 
              onClick={() => navigate('/bible')}
              className="btn-primary"
            >
              Start Reading →
            </button>
          </div>
        )}
      </div>

      <BottomNav hidden={scrollDirection === 'down'} />
    </div>
  );
}
