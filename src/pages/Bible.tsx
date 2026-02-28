import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Type, Mic, PenTool, ClipboardList, Search, Bookmark, X, BookOpen, Loader2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import BottomNav from '../components/BottomNav';

const BIBLE_BOOKS = [
  { name: 'Genesis', chapters: 50 }, { name: 'Exodus', chapters: 40 }, { name: 'Leviticus', chapters: 27 },
  { name: 'Numbers', chapters: 36 }, { name: 'Deuteronomy', chapters: 34 }, { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 }, { name: 'Ruth', chapters: 4 }, { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 }, { name: '1 Kings', chapters: 22 }, { name: '2 Kings', chapters: 25 },
  { name: '1 Chronicles', chapters: 29 }, { name: '2 Chronicles', chapters: 36 }, { name: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', chapters: 13 }, { name: 'Esther', chapters: 10 }, { name: 'Job', chapters: 42 },
  { name: 'Psalms', chapters: 150 }, { name: 'Proverbs', chapters: 31 }, { name: 'Ecclesiastes', chapters: 12 },
  { name: 'Song of Solomon', chapters: 8 }, { name: 'Isaiah', chapters: 66 }, { name: 'Jeremiah', chapters: 52 },
  { name: 'Lamentations', chapters: 5 }, { name: 'Ezekiel', chapters: 48 }, { name: 'Daniel', chapters: 12 },
  { name: 'Hosea', chapters: 14 }, { name: 'Joel', chapters: 3 }, { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 }, { name: 'Jonah', chapters: 4 }, { name: 'Micah', chapters: 7 },
  { name: 'Nahum', chapters: 3 }, { name: 'Habakkuk', chapters: 3 }, { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 }, { name: 'Zechariah', chapters: 14 }, { name: 'Malachi', chapters: 4 },
  { name: 'Matthew', chapters: 28 }, { name: 'Mark', chapters: 16 }, { name: 'Luke', chapters: 24 },
  { name: 'John', chapters: 21 }, { name: 'Acts', chapters: 28 }, { name: 'Romans', chapters: 16 },
  { name: '1 Corinthians', chapters: 16 }, { name: '2 Corinthians', chapters: 13 }, { name: 'Galatians', chapters: 6 },
  { name: 'Ephesians', chapters: 6 }, { name: 'Philippians', chapters: 4 }, { name: 'Colossians', chapters: 4 },
  { name: '1 Thessalonians', chapters: 5 }, { name: '2 Thessalonians', chapters: 3 }, { name: '1 Timothy', chapters: 6 },
  { name: '2 Timothy', chapters: 4 }, { name: 'Titus', chapters: 3 }, { name: 'Philemon', chapters: 1 },
  { name: 'Hebrews', chapters: 13 }, { name: 'James', chapters: 5 }, { name: '1 Peter', chapters: 5 },
  { name: '2 Peter', chapters: 3 }, { name: '1 John', chapters: 5 }, { name: '2 John', chapters: 1 },
  { name: '3 John', chapters: 1 }, { name: 'Jude', chapters: 1 }, { name: 'Revelation', chapters: 22 }
];

interface Verse {
  verse: number;
  text: string;
}

interface Passage {
  id: string;
  book: string;
  chapter: string;
  verses: Verse[];
}

export default function Bible() {
  const { book = 'John', chapter = '3' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentPassage, setCurrentPassage] = useState<Passage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [textSize, setTextSize] = useState(17);
  const [showSelector, setShowSelector] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorBook, setSelectorBook] = useState<{name: string, chapters: number} | null>(null);

  const [selectedWords, setSelectedWords] = useState<{verseId: string, wordIndex: number}[]>([]);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [highlights, setHighlights] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(true);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{verseId: string, wordIndex: number} | null>(null);
  const [draggingPin, setDraggingPin] = useState<'start' | 'end' | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{verseId: string, wordIndex: number} | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Hide floating nav when within 250px of the bottom
      const isNearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 250;
      setShowFloatingNav(!isNearBottom);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchPassage = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`https://bible-api.com/${book}+${chapter}?translation=web`);
        if (!response.ok) throw new Error('Failed to fetch passage');
        const data = await response.json();
        
        setCurrentPassage({
          id: `${data.verses[0].book_id}-${data.verses[0].chapter}`,
          book: data.verses[0].book_name,
          chapter: data.verses[0].chapter.toString(),
          verses: data.verses.map((v: any) => ({
            verse: v.verse,
            text: v.text.trim()
          }))
        });
      } catch (err) {
        console.error('Error fetching Bible passage:', err);
        setError('Failed to load Bible passage. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPassage();
  }, [book, chapter]);

  useEffect(() => {
    if (user && currentPassage) {
      fetchHighlights();
    }
  }, [user, currentPassage]);

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', user?.id)
        .eq('passage_id', currentPassage?.id);
        
      if (error) throw error;
      setHighlights(data || []);
    } catch (err) {
      console.error('Error fetching highlights:', err);
    }
  };

  const getFlatIndex = (verseId: string, wordIndex: number) => {
    if (!currentPassage) return -1;
    let index = 0;
    for (const v of currentPassage.verses) {
      if (v.verse.toString() === verseId) return index + wordIndex;
      index += v.text.split(' ').length;
    }
    return -1;
  };

  const getWordsInRange = (start: {verseId: string, wordIndex: number}, end: {verseId: string, wordIndex: number}) => {
    if (!currentPassage) return [];
    const startIndex = getFlatIndex(start.verseId, start.wordIndex);
    const endIndex = getFlatIndex(end.verseId, end.wordIndex);
    const min = Math.min(startIndex, endIndex);
    const max = Math.max(startIndex, endIndex);

    const range: {verseId: string, wordIndex: number}[] = [];
    let currentIndex = 0;
    for (const v of currentPassage.verses) {
      const words = v.text.split(' ');
      for (let i = 0; i < words.length; i++) {
        if (currentIndex >= min && currentIndex <= max) {
          range.push({ verseId: v.verse.toString(), wordIndex: i });
        }
        currentIndex++;
      }
    }
    return range;
  };

  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent, verseId: string, wordIndex: number) => {
    const target = e.currentTarget as HTMLElement;
    longPressTimer.current = setTimeout(() => {
      setIsSelecting(true);
      setSelectionStart({ verseId, wordIndex });
      setSelectedWords([{ verseId, wordIndex }]);
      const rect = target.getBoundingClientRect();
      setPopupPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      setShowColorPicker(false);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 300);
  };

  const handlePinDown = (e: React.TouchEvent | React.MouseEvent, type: 'start' | 'end') => {
    e.stopPropagation();
    setDraggingPin(type);
    setSelectionAnchor(type === 'start' ? selectedWords[selectedWords.length - 1] : selectedWords[0]);
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSelecting && !draggingPin) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      return;
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const element = document.elementFromPoint(clientX, clientY);
    if (element && element.hasAttribute('data-verse-id')) {
      const verseId = element.getAttribute('data-verse-id')!;
      const wordIndex = parseInt(element.getAttribute('data-word-index')!, 10);
      
      if (draggingPin && selectionAnchor) {
        const newSelection = getWordsInRange(selectionAnchor, { verseId, wordIndex });
        setSelectedWords(newSelection);
        const rect = element.getBoundingClientRect();
        setPopupPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      } else if (isSelecting && selectionStart) {
        const newSelection = getWordsInRange(selectionStart, { verseId, wordIndex });
        setSelectedWords(newSelection);
        const rect = element.getBoundingClientRect();
        setPopupPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      }
    }
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setIsSelecting(false);
    setDraggingPin(null);
  };

  const handleWordClick = (e: React.MouseEvent, verseId: string, wordIndex: number) => {
    if (isSelecting) return;
    
    let newSelection = [];
    if (selectedWords.length > 0) {
      const start = selectedWords[0];
      const clickedSameWord = selectedWords.length === 1 && start.verseId === verseId && start.wordIndex === wordIndex;
      
      if (clickedSameWord) {
        setSelectedWords([]);
        return;
      } else {
        newSelection = getWordsInRange(start, { verseId, wordIndex });
      }
    } else {
      newSelection = [{ verseId, wordIndex }];
    }
    
    setSelectedWords(newSelection);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopupPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setShowColorPicker(false);
  };

  const handleVerseClick = (e: React.MouseEvent, verseId: string) => {
    if (!currentPassage) return;
    const verse = currentPassage.verses.find(v => v.verse.toString() === verseId);
    if (!verse) return;

    const wordCount = verse.text.split(' ').length;
    const newSelection = Array.from({ length: wordCount }, (_, i) => ({
      verseId,
      wordIndex: i
    }));

    setSelectedWords(newSelection);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopupPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setShowColorPicker(false);
  };

  const handleHighlight = async (color: string) => {
    if (!user || selectedWords.length === 0 || !currentPassage) return;
    
    try {
      const startFlat = getFlatIndex(selectedWords[0].verseId, selectedWords[0].wordIndex);
      const endFlat = getFlatIndex(selectedWords[selectedWords.length - 1].verseId, selectedWords[selectedWords.length - 1].wordIndex);
      
      const newHighlight = {
        user_id: user.id,
        passage_id: currentPassage.id,
        book: currentPassage.book,
        chapter: currentPassage.chapter,
        verse: selectedWords[0].verseId,
        word_start: Math.min(startFlat, endFlat),
        word_end: Math.max(startFlat, endFlat),
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
    if (!user || !noteText.trim() || !currentPassage) return;
    
    try {
      await supabase.from('notes').insert([{
        user_id: user.id,
        passage_id: currentPassage.id,
        book: currentPassage.book,
        chapter: currentPassage.chapter,
        verse: selectedWords.length > 0 ? selectedWords[0].verseId : null,
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
    if (!user || !currentPassage) return;
    try {
      await supabase.from('notes').insert([{
        user_id: user.id,
        passage_id: currentPassage.id,
        book: currentPassage.book,
        chapter: currentPassage.chapter,
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
      if (currentPassage) {
        setNoteText(`This is a transcribed voice note about ${currentPassage.book} ${currentPassage.chapter}`);
        setShowNoteSheet(true);
      }
    } else {
      setIsRecording(true);
    }
  };

  const isWordHighlighted = (verseId: string, wordIndex: number) => {
    if (!currentPassage) return null;
    const flatIndex = getFlatIndex(verseId, wordIndex);
    const highlight = highlights.find(h => 
      h.passage_id === currentPassage.id && 
      flatIndex >= h.word_start && 
      flatIndex <= h.word_end
    );
    return highlight ? highlight.color : null;
  };

  const isWordSelected = (verseId: string, wordIndex: number) => {
    return selectedWords.some(w => w.verseId === verseId && w.wordIndex === wordIndex);
  };

  const handlePrevChapter = () => {
    if (!currentPassage) return;
    const prevChap = parseInt(currentPassage.chapter) - 1;
    if (prevChap > 0) {
      navigate(`/bible/${currentPassage.book}/${prevChap}`);
    }
  };

  const handleNextChapter = () => {
    if (!currentPassage) return;
    const nextChap = parseInt(currentPassage.chapter) + 1;
    navigate(`/bible/${currentPassage.book}/${nextChap}`);
  };

  const filteredBooks = BIBLE_BOOKS.filter(b => 
    b.name.toLowerCase().includes(selectorSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-base flex flex-col relative pb-[120px]">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 text-text-primary">
          <ArrowLeft size={24} />
        </button>
        
        <button 
          onClick={() => {
            setSelectorSearch('');
            setSelectorBook(null);
            setShowSelector(true);
          }}
          className="flex items-center gap-1.5 bg-bg-surface px-4 py-1.5 rounded-full border border-border hover:border-text-muted transition-colors"
        >
          <span className="font-bold tracking-tighter text-[16px] text-text-primary">
            {loading ? 'Loading...' : currentPassage ? `${currentPassage.book} ${currentPassage.chapter}` : 'Bible'}
          </span>
          <ChevronDown size={16} className="text-text-muted" />
        </button>
        
        <button 
          onClick={() => setTextSize(s => s >= 24 ? 15 : s + 2)}
          className="p-2 -mr-2 text-text-primary"
        >
          <Type size={20} />
        </button>
      </div>

      {/* Floating Navigation */}
      {!loading && currentPassage && (
        <div className={`fixed inset-y-0 left-2 right-2 max-w-4xl mx-auto flex items-center justify-between pointer-events-none z-30 transition-opacity duration-300 ${showFloatingNav ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={handlePrevChapter}
            disabled={currentPassage.chapter === '1'}
            className="pointer-events-auto w-10 h-10 rounded-full bg-bg-elevated/90 backdrop-blur border border-border flex items-center justify-center text-text-primary shadow-sm disabled:opacity-0 transition-all hover:bg-bg-hover hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={handleNextChapter}
            className="pointer-events-auto w-10 h-10 rounded-full bg-bg-elevated/90 backdrop-blur border border-border flex items-center justify-center text-text-primary shadow-sm transition-all hover:bg-bg-hover hover:scale-105 active:scale-95"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Reader Content */}
      <div 
        className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 select-none"
        style={{ touchAction: (isSelecting || draggingPin) ? 'none' : 'pan-y' }}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedWords([]);
          }
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-muted">
            <Loader2 size={32} className="animate-spin mb-4 text-text-primary" />
            <p className="text-[14px]">Loading World English Bible (WEB)...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-error mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-secondary">
              Try Again
            </button>
          </div>
        ) : currentPassage ? (
          <>
            <h1 className="font-bold tracking-tighter text-[32px] text-text-primary mb-8">
              {currentPassage.book} {currentPassage.chapter}
            </h1>
            
            <div className="space-y-6 mb-12">
              {currentPassage.verses.map((v) => (
                <div key={v.verse} className="flex items-start mb-2">
                  <span 
                    onClick={(e) => handleVerseClick(e, v.verse.toString())}
                    className="text-[11px] text-text-muted hover:text-text-primary cursor-pointer transition-colors font-medium mr-2 mt-1.5 select-none min-w-[16px] shrink-0"
                  >
                    {v.verse}
                  </span>
                  <div 
                    className="text-text-primary leading-[1.8] flex-1"
                    style={{ fontSize: `${textSize}px` }}
                  >
                    {v.text.split(' ').map((word, i, arr) => {
                      const highlightColor = isWordHighlighted(v.verse.toString(), i);
                      const isSelected = isWordSelected(v.verse.toString(), i);
                      const isFirstSelected = isSelected && selectedWords[0]?.verseId === v.verse.toString() && selectedWords[0]?.wordIndex === i;
                      const isLastSelected = isSelected && selectedWords[selectedWords.length - 1]?.verseId === v.verse.toString() && selectedWords[selectedWords.length - 1]?.wordIndex === i;
                      const isLastWordInVerse = i === arr.length - 1;
                      
                      return (
                        <span
                          key={i}
                          data-verse-id={v.verse.toString()}
                          data-word-index={i}
                          onClick={(e) => handleWordClick(e, v.verse.toString(), i)}
                          onTouchStart={(e) => handlePointerDown(e, v.verse.toString(), i)}
                          onMouseDown={(e) => handlePointerDown(e, v.verse.toString(), i)}
                          className={`relative cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/30' : ''}`}
                          style={{
                            backgroundColor: highlightColor && !isSelected 
                              ? (highlightColor.startsWith('#') ? highlightColor : `var(--color-highlight-${highlightColor})`) 
                              : undefined
                          }}
                        >
                          {isFirstSelected && (
                            <span 
                              className="absolute left-0 top-0 bottom-0 w-6 -ml-3 flex justify-center z-50 cursor-ew-resize"
                              onTouchStart={(e) => handlePinDown(e, 'start')}
                              onMouseDown={(e) => handlePinDown(e, 'start')}
                            >
                              <span className="w-[2px] h-full bg-blue-600 relative block">
                                <span className="absolute -top-2.5 -left-[5px] w-3 h-3 rounded-full bg-blue-600 shadow-sm block" />
                              </span>
                            </span>
                          )}
                          {word}{!isLastWordInVerse && ' '}
                          {isLastSelected && (
                            <span 
                              className="absolute right-0 top-0 bottom-0 w-6 -mr-3 flex justify-center z-50 cursor-ew-resize"
                              onTouchStart={(e) => handlePinDown(e, 'end')}
                              onMouseDown={(e) => handlePinDown(e, 'end')}
                            >
                              <span className="w-[2px] h-full bg-blue-600 relative block">
                                <span className="absolute -bottom-2.5 -left-[5px] w-3 h-3 rounded-full bg-blue-600 shadow-sm block" />
                              </span>
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Chapter Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-border">
              <button 
                onClick={handlePrevChapter}
                disabled={currentPassage.chapter === '1'}
                className="flex items-center gap-2 text-[14px] font-medium text-text-primary hover:text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <button 
                onClick={handleNextChapter}
                className="flex items-center gap-2 text-[14px] font-medium text-text-primary hover:text-text-muted transition-colors"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Book/Chapter Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg-base animate-in slide-in-from-bottom-full duration-200">
          <div className="flex items-center justify-between p-4 border-b border-border bg-bg-base">
            <div className="flex items-center gap-3">
              {selectorBook ? (
                <button onClick={() => setSelectorBook(null)} className="p-2 -ml-2 text-text-primary">
                  <ArrowLeft size={24} />
                </button>
              ) : null}
              <h2 className="text-[18px] font-bold tracking-tighter text-text-primary">
                {selectorBook ? selectorBook.name : 'Select Book'}
              </h2>
            </div>
            <button 
              onClick={() => { setShowSelector(false); setSelectorBook(null); }} 
              className="p-2 -mr-2 text-text-muted hover:text-text-primary"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {!selectorBook ? (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search books..." 
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-[15px] text-text-primary focus:outline-none focus:border-text-primary focus:ring-1 focus:ring-text-primary"
                  />
                </div>
                <div className="space-y-1 pb-20">
                  {filteredBooks.map(book => (
                    <button 
                      key={book.name}
                      onClick={() => setSelectorBook(book)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-hover text-left transition-colors"
                    >
                      <span className="text-[16px] font-medium text-text-primary">{book.name}</span>
                      <span className="text-[13px] text-text-muted">{book.chapters} ch</span>
                    </button>
                  ))}
                  {filteredBooks.length === 0 && (
                    <p className="text-center text-text-muted py-8 text-[14px]">No books found matching "{selectorSearch}"</p>
                  )}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-5 gap-2 pb-20">
                {Array.from({ length: selectorBook.chapters }, (_, i) => i + 1).map(chapter => (
                  <button
                    key={chapter}
                    onClick={() => {
                      navigate(`/bible/${selectorBook.name}/${chapter}`);
                      setShowSelector(false);
                      setSelectorBook(null);
                    }}
                    className="aspect-square flex items-center justify-center rounded-xl border border-border bg-bg-surface hover:bg-bg-hover hover:border-text-primary text-[16px] font-medium text-text-primary transition-colors"
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
            <div className="flex p-3 gap-3 items-center">
              {['yellow', 'blue', 'green', 'pink', 'red'].map(color => (
                <button
                  key={color}
                  onClick={() => handleHighlight(color)}
                  className="w-7 h-7 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-text-primary focus:ring-offset-2 focus:ring-offset-bg-elevated shrink-0"
                  style={{ backgroundColor: `var(--color-highlight-${color})` }}
                  aria-label={`Highlight ${color}`}
                />
              ))}
              
              <div className="relative w-7 h-7 rounded-full border border-border overflow-hidden shrink-0 cursor-pointer shadow-sm" title="Custom color">
                <div className="absolute inset-0 bg-[conic-gradient(red,yellow,green,cyan,blue,magenta,red)] pointer-events-none" />
                <input 
                  type="color" 
                  className="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer opacity-0"
                  onChange={(e) => handleHighlight(e.target.value)}
                />
              </div>

              <div className="w-[1px] h-6 bg-border mx-1"></div>

              <button onClick={() => setShowColorPicker(false)} className="text-text-muted hover:text-text-primary transition-colors">
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
      {showNoteSheet && currentPassage && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-bg-elevated rounded-t-2xl sm:rounded-2xl border border-border p-5 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-bold tracking-tighter text-text-primary">
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
                className="w-full bg-bg-input border border-border rounded-xl p-3.5 text-[15px] text-text-primary min-h-[120px] focus:outline-none focus:border-text-primary focus:ring-1 focus:ring-text-primary resize-none"
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
