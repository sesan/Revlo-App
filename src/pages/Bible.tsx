import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Type, Mic, PenTool, ClipboardList, Search, Bookmark, X, BookOpen } from 'lucide-react';
import { KJV_PASSAGES } from '../lib/data';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import BottomNav from '../components/BottomNav';

export default function Bible() {
  const { book, chapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [textSize, setTextSize] = useState(17);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedWords, setSelectedWords] = useState<{verseId: string, wordIndex: number}[]>([]);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [highlights, setHighlights] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const currentPassage = KJV_PASSAGES.find(
    p => p.book.toLowerCase() === book?.toLowerCase() && p.chapter.toString() === chapter
  ) || KJV_PASSAGES[0];

  useEffect(() => {
    if (user && currentPassage) {
      fetchHighlights();
    }
  }, [user, currentPassage]);

  const fetchHighlights = async () => {
    try {
      // In a real app we would query by passage_id, but here we mock it with the first verse's ID
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', user?.id);
        
      if (error) throw error;
      setHighlights(data || []);
    } catch (err) {
      console.error('Error fetching highlights:', err);
    }
  };

  const handleWordClick = (e: React.MouseEvent, verseId: string, wordIndex: number) => {
    // Simple selection logic for prototype
    const newSelection = [{ verseId, wordIndex }];
    setSelectedWords(newSelection);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopupPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setShowColorPicker(false);
  };

  const handleHighlight = async (color: string) => {
    if (!user || selectedWords.length === 0) return;
    
    try {
      const { verseId, wordIndex } = selectedWords[0];
      
      const newHighlight = {
        user_id: user.id,
        passage_id: currentPassage.id, // Using the passage group ID for simplicity
        word_start: wordIndex,
        word_end: wordIndex,
        color: color
      };

      await supabase.from('highlights').insert([newHighlight]);
      
      setHighlights([...highlights, newHighlight]);
      setSelectedWords([]);
    } catch (err) {
      console.error('Error saving highlight:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !noteText.trim()) return;
    
    try {
      await supabase.from('notes').insert([{
        user_id: user.id,
        passage_id: currentPassage.id,
        content: noteText,
        type: 'note'
      }]);
      
      setShowNoteSheet(false);
      setNoteText('');
      setSelectedWords([]);
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    try {
      await supabase.from('notes').insert([{
        user_id: user.id,
        passage_id: currentPassage.id,
        content: `${currentPassage.book} ${currentPassage.chapter}`,
        type: 'bookmark'
      }]);
      alert('Bookmarked!');
    } catch (err) {
      console.error('Error saving bookmark:', err);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Mock transcription
      setNoteText("This is a transcribed voice note about " + currentPassage.book + " " + currentPassage.chapter);
      setShowNoteSheet(true);
    } else {
      setIsRecording(true);
    }
  };

  const isWordHighlighted = (wordIndex: number) => {
    const highlight = highlights.find(h => 
      h.passage_id === currentPassage.id && 
      wordIndex >= h.word_start && 
      wordIndex <= h.word_end
    );
    return highlight ? highlight.color : null;
  };

  const isWordSelected = (verseId: string, wordIndex: number) => {
    return selectedWords.some(w => w.verseId === verseId && w.wordIndex === wordIndex);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col relative pb-[120px]">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-primary">
          <ArrowLeft size={24} />
        </button>
        
        <button 
          onClick={() => setShowSelector(true)}
          className="font-bold tracking-tighter text-[18px] text-text-primary"
        >
          {currentPassage.book} {currentPassage.chapter}
        </button>
        
        <button 
          onClick={() => setTextSize(s => s === 24 ? 15 : s + 2)}
          className="p-2 -mr-2 text-text-primary"
        >
          <Type size={20} />
        </button>
      </div>

      {/* Reader Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <h1 className="font-bold tracking-tighter text-[32px] text-text-primary mb-8">
          {currentPassage.book} {currentPassage.chapter}
        </h1>
        
        <div className="space-y-6">
          {currentPassage.verses.map((v) => (
            <div key={v.verse} className="flex items-start">
              <span className="text-[11px] text-gold font-medium mr-2 mt-1.5 select-none">
                {v.verse}
              </span>
              <p 
                className="text-text-primary leading-[1.8] flex-1 flex flex-wrap"
                style={{ fontSize: `${textSize}px` }}
              >
                {v.text.split(' ').map((word, i) => {
                  const highlightColor = isWordHighlighted(i);
                  const isSelected = isWordSelected(v.verse.toString(), i);
                  
                  return (
                    <span
                      key={i}
                      onClick={(e) => handleWordClick(e, v.verse.toString(), i)}
                      className={`mr-1 cursor-pointer transition-colors rounded-sm px-0.5 -mx-0.5
                        ${isSelected ? 'border-b-2 border-gold bg-gold/10' : ''}
                      `}
                      style={{
                        backgroundColor: highlightColor ? `var(--color-highlight-${highlightColor})` : undefined
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Popup Action Menu */}
      {selectedWords.length > 0 && (
        <div 
          className="fixed z-50 bg-bg-elevated border border-border rounded-xl shadow-2xl flex items-center overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: Math.max(10, Math.min(window.innerWidth - 280, popupPos.x - 140)), 
            top: Math.max(60, popupPos.y - 60) 
          }}
        >
          {showColorPicker ? (
            <div className="flex p-3 gap-3">
              {['yellow', 'blue', 'green', 'pink', 'red'].map(color => (
                <button
                  key={color}
                  onClick={() => handleHighlight(color)}
                  className="w-7 h-7 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-bg-elevated"
                  style={{ backgroundColor: `var(--color-highlight-${color})` }}
                  aria-label={`Highlight ${color}`}
                />
              ))}
              <button onClick={() => setShowColorPicker(false)} className="ml-2 text-text-muted">
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex">
              <button onClick={() => setShowColorPicker(true)} className="px-3.5 py-2.5 text-[13px] text-text-primary hover:bg-bg-hover flex items-center gap-1.5 border-r border-border">
                <span className="w-3 h-3 rounded-full bg-highlight-yellow border border-yellow-500/50"></span>
                Highlight
              </button>
              <button onClick={() => setShowNoteSheet(true)} className="px-3.5 py-2.5 text-[13px] text-text-primary hover:bg-bg-hover flex items-center gap-1.5 border-r border-border">
                <PenTool size={14} /> Note
              </button>
              <button onClick={() => navigate('/journal')} className="px-3.5 py-2.5 text-[13px] text-text-primary hover:bg-bg-hover flex items-center gap-1.5 border-r border-border">
                <BookOpen size={14} /> Journal
              </button>
              <button onClick={() => setSelectedWords([])} className="px-3.5 py-2.5 text-[13px] text-text-primary hover:bg-bg-hover">
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Note Bottom Sheet */}
      {showNoteSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-bg-elevated rounded-t-2xl sm:rounded-2xl border border-border p-5 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-medium text-gold">
                {currentPassage.book} {currentPassage.chapter}
              </h3>
              <button onClick={() => setShowNoteSheet(false)} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative mb-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note..."
                className="w-full bg-bg-input border border-border rounded-xl p-3.5 text-[15px] text-text-primary min-h-[120px] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold resize-none"
                autoFocus
              />
              <span className="absolute bottom-3 right-3 text-[11px] text-text-muted">
                {noteText.length}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowNoteSheet(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleSaveNote} className="btn-primary flex-1">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="fixed bottom-[60px] left-0 right-0 bg-bg-elevated border-t border-border z-40">
        <div className="flex justify-around items-center h-14 max-w-md mx-auto px-2">
          <button 
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors ${isRecording ? 'text-error bg-error/10 animate-pulse' : 'text-text-primary hover:bg-bg-hover'}`}
          >
            <Mic size={24} />
          </button>
          <button onClick={() => navigate('/journal')} className="p-2 rounded-full text-text-primary hover:bg-bg-hover">
            <PenTool size={24} />
          </button>
          <button onClick={() => navigate('/notes')} className="p-2 rounded-full text-text-primary hover:bg-bg-hover">
            <ClipboardList size={24} />
          </button>
          <button onClick={() => navigate('/notes')} className="p-2 rounded-full text-text-primary hover:bg-bg-hover">
            <Search size={24} />
          </button>
          <button onClick={handleBookmark} className="p-2 rounded-full text-text-primary hover:bg-bg-hover">
            <Bookmark size={24} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
