import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PenTool, Search, LogOut, Flame, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import { format, differenceInDays, isSameDay, subDays } from 'date-fns';

export default function Home() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (user) {
      fetchRecentNotes();
      calculateStreak();
    }
  }, [user]);

  useEffect(() => {
    if (profile && !profile.full_name) {
      setShowNamePrompt(true);
    }
  }, [profile]);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: nameInput.trim() })
        .eq('id', user?.id);

      if (error) throw error;
      
      await refreshProfile();
      setShowNamePrompt(false);
    } catch (err) {
      console.error('Error saving name:', err);
    }
  };

  const calculateStreak = async () => {
    try {
      // Fetch dates of recent activity (notes, highlights, journal)
      // For simplicity, we'll just check notes for now as a proxy for activity
      const { data: notesData } = await supabase
        .from('notes')
        .select('created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (!notesData || notesData.length === 0) {
        setStreak(0);
        return;
      }

      const dates = notesData.map(n => new Date(n.created_at));
      let currentStreak = 0;
      let checkDate = new Date();
      
      // Check if there's activity today
      const hasActivityToday = dates.some(d => isSameDay(d, checkDate));
      if (hasActivityToday) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        // If no activity today, check if there was activity yesterday (streak still active but not incremented for today yet)
        const hasActivityYesterday = dates.some(d => isSameDay(d, subDays(checkDate, 1)));
        if (!hasActivityYesterday) {
          setStreak(0);
          return;
        }
        checkDate = subDays(checkDate, 1);
      }

      // Count backwards
      while (true) {
        const hasActivity = dates.some(d => isSameDay(d, checkDate));
        if (hasActivity) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      setStreak(currentStreak);
    } catch (err) {
      console.error('Error calculating streak:', err);
    }
  };

  const fetchRecentNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          content,
          type,
          created_at,
          book,
          chapter,
          verse
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.full_name?.split(' ')[0];
    
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 18) timeGreeting = 'Good afternoon';
    if (hour >= 18) timeGreeting = 'Good evening';

    if (name) return `${timeGreeting}, ${name}.`;
    return `${timeGreeting}.`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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

  return (
    <div className="min-h-screen pb-[80px] flex flex-col items-center">
      <div className="w-full max-w-[600px] p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 relative">
          <h1 className="text-[20px] font-bold tracking-tighter text-text-primary">Verse</h1>
          
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-[14px] font-medium text-text-primary hover:border-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
              aria-label="Profile menu"
            >
              {getInitials(profile?.full_name)}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-bg-elevated border border-border rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-border">
                  <p className="text-[14px] font-medium text-text-primary truncate">{profile?.full_name}</p>
                  <p className="text-[12px] text-text-muted truncate">{profile?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-[14px] text-error hover:bg-bg-hover flex items-center gap-2"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-[26px] font-bold tracking-tighter text-text-primary mb-1">{getGreeting()}</h2>
          <p className="text-[14px] text-text-secondary">Ready to continue your journey?</p>
        </div>

        {/* Streak Card */}
        <div className="bg-bg-surface border border-border rounded-2xl p-5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${streak > 0 ? 'bg-orange-100 text-orange-500' : 'bg-bg-hover text-text-muted'}`}>
              <Flame size={24} fill={streak > 0 ? "currentColor" : "none"} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text-primary">
                {streak} Day Streak
              </h3>
              <p className="text-[13px] text-text-secondary">
                {streak > 0 ? "Keep the momentum going!" : "Start your streak today!"}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Reading Card */}
        <div 
          onClick={() => navigate('/bible')}
          className="bg-bg-surface border border-border rounded-2xl p-5 mb-8 relative overflow-hidden cursor-pointer hover:border-gold transition-colors group"
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold to-gold-hover"></div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gold mb-2 font-medium flex items-center gap-1">
                <Calendar size={12} />
                TODAY'S READING
              </p>
              <h3 className="text-[20px] font-bold tracking-tighter text-text-primary mb-1 group-hover:text-gold transition-colors">
                {profile?.current_plan || 'The Story of Jesus'}
              </h3>
              <p className="text-[14px] text-text-secondary">
                Day {profile?.current_day || 1} • John 3
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-bg-hover flex items-center justify-center text-text-primary group-hover:bg-gold group-hover:text-white transition-colors">
              <ChevronRight size={20} />
            </div>
          </div>
          
          <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
            <div 
              className="h-full bg-gold rounded-full transition-all duration-500" 
              style={{ width: `${((profile?.current_day || 1) / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Recent Notes */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[18px] font-bold tracking-tighter text-text-primary">Recent Notes</h3>
            <button
              onClick={() => navigate('/notes')}
              className="text-[13px] text-gold hover:underline font-medium"
            >
              View all
            </button>
          </div>
          
          {recentNotes.length > 0 ? (
            <div className="space-y-3 mb-4">
              {recentNotes.map((note) => (
                <div key={note.id} onClick={() => navigate(`/notes/${note.id}`)} className="bg-bg-surface border border-border rounded-xl p-4 hover:bg-bg-hover cursor-pointer transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bible/${note.book}/${note.chapter}?verse=${note.verse}`);
                      }}
                      className="text-[13px] font-medium text-gold hover:underline text-left"
                    >
                      {note.book} {note.chapter}{note.verse ? `:${note.verse}` : ''}
                    </button>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize ${getTypeColor(note.type)}`}>
                      {note.type}
                    </span>
                  </div>
                  <p className="text-[14px] text-text-secondary truncate mb-2">
                    {note.content || 'No preview available'}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {format(new Date(note.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bg-surface border border-border rounded-xl p-6 text-center mb-4">
              <p className="text-[14px] text-text-secondary mb-2">No notes yet.</p>
              <p className="text-[13px] text-text-muted">Start reading to add highlights and notes.</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Name Prompt Modal */}
      {showNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-bg-elevated border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-[20px] font-bold tracking-tighter text-text-primary mb-2">Welcome to Verse</h3>
            <p className="text-[14px] text-text-secondary mb-4">What should we call you?</p>
            
            <input
              type="text"
              placeholder="Your First Name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-xl p-3 text-[15px] text-text-primary focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold mb-4"
              autoFocus
            />
            
            <button
              onClick={handleSaveName}
              disabled={!nameInput.trim()}
              className="btn-primary w-full"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
