import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Type, Mic, PenTool, ClipboardList, Search, Bookmark, X, BookOpen, Loader2, ChevronLeft, ChevronRight, ChevronDown, Copy, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import BottomNav from '../components/BottomNav';
import JournalSheet from '../components/JournalSheet';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

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
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0, bottomY: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [showJournalSheet, setShowJournalSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [highlights, setHighlights] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(true);
  
  // Lock body scroll when sheets are open on mobile
  useLockBodyScroll(isMobile && (showColorPicker || showNoteSheet));

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{verseId: string, wordIndex: number} | null>(null);
  const [draggingPin, setDraggingPin] = useState<'start' | 'end' | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{verseId: string, wordIndex: number} | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{x: number, y: number} | null>(null);
  const justFinishedSelection = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      // Hide floating nav when within 250px of the bottom
      const isNearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 250;
      setShowFloatingNav(!isNearBottom);
    };
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
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

  const updatePopupPosition = (selection: {verseId: string, wordIndex: number}[]) => {
    if (selection.length === 0) return;
    
    const firstWord = selection[0];
    const lastWord = selection[selection.length - 1];
    
    // Find the DOM elements for the first and last words
    const firstEl = document.querySelector(`[data-verse-id="${firstWord.verseId}"][data-word-index="${firstWord.wordIndex}"]`);
    const lastEl = document.querySelector(`[data-verse-id="${lastWord.verseId}"][data-word-index="${lastWord.wordIndex}"]`);
    
    if (firstEl && lastEl) {
      const firstRect = firstEl.getBoundingClientRect();
      const lastRect = lastEl.getBoundingClientRect();
      
      setPopupPos({ 
        x: window.innerWidth / 2, 
        y: firstRect.top - 10, 
        bottomY: lastRect.bottom + 10 
      });
    }
  };

  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent, verseId: string, wordIndex: number) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    touchStartPos.current = { x: clientX, y: clientY };

    longPressTimer.current = setTimeout(() => {
      setIsSelecting(true);
      setSelectionStart({ verseId, wordIndex });
      const newSelection = [{ verseId, wordIndex }];
      setSelectedWords(newSelection);
      updatePopupPosition(newSelection);
      setShowColorPicker(false);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 200);
  };

  const handleVersePointerDown = (e: React.TouchEvent | React.MouseEvent, verseId: string) => {
    if (!currentPassage) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    touchStartPos.current = { x: clientX, y: clientY };

    longPressTimer.current = setTimeout(() => {
      const verse = currentPassage.verses.find(v => v.verse.toString() === verseId);
      if (!verse) return;

      setIsSelecting(true);
      const wordCount = verse.text.split(' ').length;
      const newSelection = Array.from({ length: wordCount }, (_, i) => ({
        verseId,
        wordIndex: i
      }));

      setSelectionStart(newSelection[0]);
      setSelectedWords(newSelection);
      updatePopupPosition(newSelection);
      setShowColorPicker(false);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 200);
  };

  const handleWordPointerDown = (e: React.TouchEvent | React.MouseEvent, verseId: string, wordIndex: number) => {
    if (!currentPassage || !isMobile) return;
    
    const highlight = getHighlightForWord(verseId, wordIndex);
    if (highlight) {
      // If tapping a highlighted word on mobile, select the whole highlight immediately
      let newSelection: {verseId: string, wordIndex: number}[] = [];
      let currentIndex = 0;
      for (const v of currentPassage.verses) {
        const words = v.text.split(' ');
        for (let i = 0; i < words.length; i++) {
          if (currentIndex >= highlight.word_start && currentIndex <= highlight.word_end) {
            newSelection.push({ verseId: v.verse.toString(), wordIndex: i });
          }
          currentIndex++;
        }
      }
      setSelectedWords(newSelection);
      updatePopupPosition(newSelection);
      setShowColorPicker(false);
      return;
    }
    
    // Otherwise, fall back to normal long press behavior
    handlePointerDown(e, verseId, wordIndex);
  };

  const handlePinDown = (e: React.TouchEvent | React.MouseEvent, type: 'start' | 'end') => {
    e.stopPropagation();
    setDraggingPin(type);
    setSelectionAnchor(type === 'start' ? selectedWords[selectedWords.length - 1] : selectedWords[0]);
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (!isSelecting && !draggingPin) {
      // Allow small movement during long press (10px threshold)
      if (longPressTimer.current && touchStartPos.current) {
        const dx = Math.abs(clientX - touchStartPos.current.x);
        const dy = Math.abs(clientY - touchStartPos.current.y);
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }
    
    // Prevent scrolling while selecting
    if (e.cancelable && (isSelecting || draggingPin)) {
       e.preventDefault();
    }

    // On mobile, look up slightly above the finger so the user can see what they are selecting
    // Removed offset as per user request to start exactly where the finger is
    const lookupY = clientY;
    const element = document.elementFromPoint(clientX, lookupY);

    if (element && element.hasAttribute('data-verse-id')) {
      const verseId = element.getAttribute('data-verse-id')!;
      const wordIndex = parseInt(element.getAttribute('data-word-index')!, 10);
      
      if (draggingPin && selectionAnchor) {
        // @ts-ignore
        const newSelection = getWordsInRange(selectionAnchor, { verseId, wordIndex });
        setSelectedWords(newSelection);
        updatePopupPosition(newSelection);
      } else if (isSelecting && selectionStart) {
        const newSelection = getWordsInRange(selectionStart, { verseId, wordIndex });
        setSelectedWords(newSelection);
        updatePopupPosition(newSelection);
      }
    }
  };

  const handlePointerUp = (e?: React.TouchEvent | React.MouseEvent) => {
    if (isSelecting) {
      if (e && e.cancelable && e.type === 'touchend') {
        e.preventDefault();
      }
      justFinishedSelection.current = true;
      setTimeout(() => { justFinishedSelection.current = false; }, 500);
    }

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
    setIsSelecting(false);
    setDraggingPin(null);
  };

  const handleWordClick = (e: React.MouseEvent, verseId: string, wordIndex: number) => {
    e.stopPropagation();
    if (isSelecting || isMobile) return; // Disable single-tap selection on mobile
    
    if (selectedWords.length > 0) {
      const isWordSelected = selectedWords.some(w => w.verseId === verseId && w.wordIndex === wordIndex);
      
      if (isWordSelected) {
        setSelectedWords([]);
        return;
      }
    }

    const highlight = getHighlightForWord(verseId, wordIndex);
    let newSelection = [{ verseId, wordIndex }];

    if (highlight && currentPassage) {
      // Select the entire highlight
      newSelection = [];
      let currentIndex = 0;
      for (const v of currentPassage.verses) {
        const words = v.text.split(' ');
        for (let i = 0; i < words.length; i++) {
          if (currentIndex >= highlight.word_start && currentIndex <= highlight.word_end) {
            newSelection.push({ verseId: v.verse.toString(), wordIndex: i });
          }
          currentIndex++;
        }
      }
    }
    
    setSelectedWords(newSelection);
    updatePopupPosition(newSelection);
    setShowColorPicker(false);
  };

  const handleVerseClick = (e: React.MouseEvent, verseId: string) => {
    e.stopPropagation();
    if (!currentPassage || isMobile) return; // Disable single-tap selection on mobile
    const verse = currentPassage.verses.find(v => v.verse.toString() === verseId);
    if (!verse) return;

    const wordCount = verse.text.split(' ').length;
    const newSelection = Array.from({ length: wordCount }, (_, i) => ({
      verseId,
      wordIndex: i
    }));

    setSelectedWords(newSelection);
    updatePopupPosition(newSelection);
    setShowColorPicker(false);
  };

  const handleHighlight = async (color: string) => {
    if (!user || selectedWords.length === 0 || !currentPassage) return;
    
    try {
      const startFlat = getFlatIndex(selectedWords[0].verseId, selectedWords[0].wordIndex);
      const endFlat = getFlatIndex(selectedWords[selectedWords.length - 1].verseId, selectedWords[selectedWords.length - 1].wordIndex);
      
      const minFlat = Math.min(startFlat, endFlat);
      const maxFlat = Math.max(startFlat, endFlat);

      // Check if we are updating an existing highlight
      const existingHighlight = highlights.find(h => 
        h.passage_id === currentPassage.id && 
        ((minFlat >= h.word_start && minFlat <= h.word_end) || 
         (maxFlat >= h.word_start && maxFlat <= h.word_end) ||
         (minFlat <= h.word_start && maxFlat >= h.word_end))
      );

      if (existingHighlight) {
        // Update existing highlight
        await supabase
          .from('highlights')
          .update({ color })
          .eq('id', existingHighlight.id);
          
        setHighlights(highlights.map(h => 
          h.id === existingHighlight.id ? { ...h, color } : h
        ));
      } else {
        // Create new highlight
        const newHighlight = {
          user_id: user.id,
          passage_id: currentPassage.id,
          book: currentPassage.book,
          chapter: currentPassage.chapter,
          verse: selectedWords[0].verseId,
          word_start: minFlat,
          word_end: maxFlat,
          color: color
        };

        const { data, error } = await supabase.from('highlights').insert([newHighlight]).select();
        
        if (error) throw error;
        if (data && data.length > 0) {
          setHighlights([...highlights, data[0]]);
        } else {
          // Fallback if select() doesn't return data but insert succeeded
          setHighlights([...highlights, newHighlight]);
        }
      }
      
      setSelectedWords([]);
    } catch (err) {
      console.error('Error saving highlight:', err);
    }
  };

  const handleDeleteHighlight = async () => {
    if (!user || selectedWords.length === 0 || !currentPassage) return;
    
    try {
      const startFlat = getFlatIndex(selectedWords[0].verseId, selectedWords[0].wordIndex);
      
      const existingHighlight = highlights.find(h => 
        h.passage_id === currentPassage.id && 
        startFlat >= h.word_start && 
        startFlat <= h.word_end
      );

      if (existingHighlight && existingHighlight.id) {
        await supabase
          .from('highlights')
          .delete()
          .eq('id', existingHighlight.id);
          
        setHighlights(highlights.filter(h => h.id !== existingHighlight.id));
      }
      
      setSelectedWords([]);
      setShowColorPicker(false);
    } catch (err) {
      console.error('Error deleting highlight:', err);
    }
  };

  const handleCopy = async () => {
    if (!currentPassage || selectedWords.length === 0) return;
    
    // Sort selected words to ensure they are in order
    const sortedSelection = [...selectedWords].sort((a, b) => {
      if (a.verseId !== b.verseId) {
        return parseInt(a.verseId) - parseInt(b.verseId);
      }
      return a.wordIndex - b.wordIndex;
    });

    // Group by verse
    const versesMap = new Map<string, string[]>();
    sortedSelection.forEach(({ verseId, wordIndex }) => {
      const verse = currentPassage.verses.find(v => v.verse.toString() === verseId);
      if (verse) {
        const words = verse.text.split(' ');
        if (!versesMap.has(verseId)) {
          versesMap.set(verseId, []);
        }
        versesMap.get(verseId)!.push(words[wordIndex]);
      }
    });

    // Construct text
    let copiedText = '';
    versesMap.forEach((words, verseId) => {
      copiedText += `[${verseId}] ${words.join(' ')}\n`;
    });
    
    copiedText += `\n— ${currentPassage.book} ${currentPassage.chapter}`;

    try {
      await navigator.clipboard.writeText(copiedText.trim());
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      setSelectedWords([]);
    } catch (err) {
      console.error('Failed to copy text:', err);
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

  const getHighlightForWord = (verseId: string, wordIndex: number) => {
    if (!currentPassage) return null;
    const flatIndex = getFlatIndex(verseId, wordIndex);
    return highlights.find(h => 
      h.passage_id === currentPassage.id && 
      flatIndex >= h.word_start && 
      flatIndex <= h.word_end
    ) || null;
  };

  const isWordHighlighted = (verseId: string, wordIndex: number) => {
    const highlight = getHighlightForWord(verseId, wordIndex);
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

  const getSelectedVerses = () => {
    if (!currentPassage || selectedWords.length === 0) return undefined;
    
    const uniqueVerseIds = Array.from(new Set(selectedWords.map(w => w.verseId)))
      .sort((a: string, b: string) => parseInt(a) - parseInt(b));
    
    return uniqueVerseIds
      .map(id => currentPassage.verses.find(v => v.verse.toString() === id))
      .filter((v): v is Verse => v !== undefined);
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
          const target = e.target as HTMLElement;
          // Clear selection if clicking outside a word and outside the popup menu
          if (!target.closest('[data-verse-id]') && !target.closest('.fixed')) {
            if (justFinishedSelection.current) return;
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
                    onTouchStart={(e) => handleVersePointerDown(e, v.verse.toString())}
                    onMouseDown={(e) => handleVersePointerDown(e, v.verse.toString())}
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
                          onTouchStart={(e) => handleWordPointerDown(e, v.verse.toString(), i)}
                          onMouseDown={(e) => isMobile ? handleWordPointerDown(e, v.verse.toString(), i) : handlePointerDown(e, v.verse.toString(), i)}
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
      {selectedWords.length > 0 && !isSelecting && !draggingPin && (
        <>
          {/* Mobile Overlay */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200" 
              onClick={() => {
                if (justFinishedSelection.current) return;
                setShowColorPicker(false);
                setSelectedWords([]);
              }} 
            />
          )}
          
          <div 
            className={`fixed z-50 bg-bg-elevated border border-border shadow-2xl overflow-hidden animate-in duration-200 ${
              isMobile
                ? 'bottom-0 left-0 right-0 rounded-t-2xl slide-in-from-bottom-full pb-safe' 
                : 'rounded-xl fade-in zoom-in-95'
            }`}
            style={
              isMobile
                ? {} // Let CSS handle bottom sheet positioning
                : { 
                    left: Math.max(10, Math.min(window.innerWidth - (showColorPicker ? 240 : 280), popupPos.x - (showColorPicker ? 112 : 140))), 
                    ...(popupPos.y > window.innerHeight / 2
                      ? { bottom: Math.max(10, window.innerHeight - popupPos.y + 10) } 
                      : { top: Math.max(60, popupPos.bottomY) }
                    )
                  }
            }
          >
            {showColorPicker ? (
              <div className={`flex flex-col ${isMobile ? 'w-full max-h-[80vh] overscroll-contain pb-[calc(env(safe-area-inset-bottom)+20px)]' : 'w-56 max-h-[calc(100vh-120px)]'} overflow-y-auto`}>
                <div className={`flex justify-between items-center ${isMobile ? 'px-4 py-3' : 'px-3 py-2'} border-b border-border bg-bg-surface`}>
                  <span className={`${isMobile ? 'text-[12px]' : 'text-[11px]'} font-semibold text-text-secondary uppercase tracking-wider`}>Highlight Theme</span>
                  <button onClick={() => setShowColorPicker(false)} className="text-text-muted hover:text-text-primary transition-colors p-1">
                    <X size={16} className={isMobile ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
                  </button>
                </div>
                <div className={`flex flex-col ${isMobile ? 'p-2 gap-1 pb-6' : 'p-1.5 gap-0.5'}`}>
                  {[
                    { color: 'yellow', label: 'God, Jesus, Holy Spirit' },
                    { color: 'green', label: 'Growth, Encouragement' },
                    { color: 'blue', label: 'Faith, Grace, Trust' },
                    { color: 'red', label: 'Salvation, Sacrifice' },
                    { color: 'pink', label: 'Love, Family, Relationships' },
                  ].map(theme => (
                    <button
                      key={theme.color}
                      onClick={() => handleHighlight(theme.color)}
                      className={`w-full flex items-center ${isMobile ? 'gap-4 px-3 py-3 rounded-lg' : 'gap-3 px-2.5 py-2 rounded-md'} hover:bg-bg-hover transition-colors text-left group`}
                    >
                      <div 
                        className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} rounded-full border border-border shrink-0 group-hover:scale-110 transition-transform`}
                        style={{ backgroundColor: `var(--color-highlight-${theme.color})` }}
                      />
                      <span className={`${isMobile ? 'text-[15px]' : 'text-[13px]'} text-text-primary`}>{theme.label}</span>
                    </button>
                  ))}
                  
                  <div className={`h-[1px] bg-border ${isMobile ? 'my-2 mx-3' : 'my-1 mx-2'}`}></div>
                  
                  <div className={`w-full flex items-center ${isMobile ? 'gap-4 px-3 py-3 rounded-lg' : 'gap-3 px-2.5 py-2 rounded-md'} hover:bg-bg-hover transition-colors text-left relative cursor-pointer group`}>
                    <div className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} rounded-full border border-border overflow-hidden shrink-0 shadow-sm relative group-hover:scale-110 transition-transform`}>
                      <div className="absolute inset-0 bg-[conic-gradient(red,yellow,green,cyan,blue,magenta,red)] pointer-events-none" />
                      <input 
                        type="color" 
                        className="absolute inset-[-10px] w-[40px] h-[40px] cursor-pointer opacity-0"
                        onChange={(e) => handleHighlight(e.target.value)}
                      />
                    </div>
                    <span className={`${isMobile ? 'text-[15px]' : 'text-[13px]'} text-text-primary`}>Custom Color...</span>
                  </div>
                </div>
              </div>
            ) : (
            <div className={`flex ${isMobile ? 'flex-col p-2 gap-1 pb-6' : 'items-center'}`}>
              <button onClick={() => setShowColorPicker(true)} className={`${isMobile ? 'w-full px-4 py-3.5 rounded-lg text-[15px] gap-3' : 'px-3.5 py-2.5 text-[13px] gap-1.5 border-r border-border'} text-text-primary hover:bg-bg-hover flex items-center`}>
                <span className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'} rounded-full bg-highlight-yellow border border-yellow-500/50`}></span>
                Highlight
              </button>
              <button onClick={() => setShowNoteSheet(true)} className={`${isMobile ? 'w-full px-4 py-3.5 rounded-lg text-[15px] gap-3' : 'px-3.5 py-2.5 text-[13px] gap-1.5 border-r border-border'} text-text-primary hover:bg-bg-hover flex items-center`}>
                <PenTool size={isMobile ? 18 : 14} /> Note
              </button>
              <button onClick={() => setShowJournalSheet(true)} className={`${isMobile ? 'w-full px-4 py-3.5 rounded-lg text-[15px] gap-3' : 'px-3.5 py-2.5 text-[13px] gap-1.5 border-r border-border'} text-text-primary hover:bg-bg-hover flex items-center`}>
                <BookOpen size={isMobile ? 18 : 14} /> Journal
              </button>
              <button onClick={handleCopy} className={`${isMobile ? 'w-full px-4 py-3.5 rounded-lg text-[15px] gap-3' : 'px-3.5 py-2.5 text-[13px] gap-1.5 border-r border-border'} text-text-primary hover:bg-bg-hover flex items-center`}>
                <Copy size={isMobile ? 18 : 14} /> Copy
              </button>
              {selectedWords.length > 0 && getHighlightForWord(selectedWords[0].verseId, selectedWords[0].wordIndex) && (
                <button onClick={handleDeleteHighlight} className={`${isMobile ? 'w-full px-4 py-3.5 rounded-lg text-[15px] gap-3 text-error' : 'px-3.5 py-2.5 text-[13px] gap-1.5 text-error'} hover:bg-error/10 flex items-center`}>
                  <Trash2 size={isMobile ? 18 : 14} /> Delete
                </button>
              )}
            </div>
          )}
          </div>
        </>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-bg-elevated border border-gold rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-gold" />
            <span className="text-[14px] text-text-primary font-medium">Copied to clipboard</span>
          </div>
        </div>
      )}

      {/* Journal Sheet Modal */}
      {currentPassage && (
        <JournalSheet 
          isOpen={showJournalSheet} 
          onClose={() => setShowJournalSheet(false)} 
          currentPassage={currentPassage}
          selectedVerses={getSelectedVerses()}
        />
      )}

      {/* Add Note Bottom Sheet */}
      {showNoteSheet && currentPassage && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-bg-elevated rounded-t-2xl sm:rounded-2xl border border-border p-5 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 max-h-[80vh] overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+20px)]">
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
          <button onClick={() => setShowJournalSheet(true)} className="p-2 rounded-full text-text-primary hover:bg-bg-hover">
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
