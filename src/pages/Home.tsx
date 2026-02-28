import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PenTool, Search, LogOut, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import { format } from 'date-fns';

export default function Home() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecentNotes();
    }
  }, [user]);

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
    const name = profile?.full_name?.split(' ')[0] || 'Friend';
    if (hour < 12) return `Good morning, ${name}.`;
    if (hour < 18) return `Good afternoon, ${name}.`;
    return `Good evening, ${name}.`;
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
        <div className="flex justify-between items-center mb-8 relative">
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
          <p className="text-[14px] text-text-secondary">Continue where you left off.</p>
        </div>

        {/* Today's Reading Card */}
        <div className="bg-bg-surface border border-border rounded-2xl p-5 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold to-gold-hover"></div>
          
          <p className="text-[10px] uppercase tracking-[0.1em] text-gold mb-2 font-medium">
            TODAY'S READING
          </p>
          <h3 className="text-[18px] font-bold tracking-tighter text-text-primary mb-1">
            {profile?.current_plan || 'The Story of Jesus'}
          </h3>
          <p className="text-[13px] text-text-muted mb-4">
            Day {profile?.current_day || 1} of 7
          </p>
          
          <div className="h-1 bg-border rounded-full mb-6 overflow-hidden">
            <div 
              className="h-full bg-gold rounded-full" 
              style={{ width: `${((profile?.current_day || 1) / 7) * 100}%` }}
            ></div>
          </div>
          
          <button
            onClick={() => navigate('/bible')}
            className="btn-primary w-full"
          >
            Continue Reading →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <button
            onClick={() => navigate('/bible')}
            className="bg-bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-bg-hover hover:border-gold transition-colors min-h-[88px]"
          >
            <BookOpen size={24} className="text-gold" />
            <span className="text-[12px] text-text-primary font-medium">Open Bible</span>
          </button>
          
          <button
            onClick={() => navigate('/journal')}
            className="bg-bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-bg-hover hover:border-gold transition-colors min-h-[88px]"
          >
            <PenTool size={24} className="text-gold" />
            <span className="text-[12px] text-text-primary font-medium">New Journal</span>
          </button>
          
          <button
            onClick={() => navigate('/notes')}
            className="bg-bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-bg-hover hover:border-gold transition-colors min-h-[88px]"
          >
            <Search size={24} className="text-gold" />
            <span className="text-[12px] text-text-primary font-medium">Search Notes</span>
          </button>
        </div>

        {/* Recent Notes */}
        <div>
          <h3 className="text-[18px] font-bold tracking-tighter text-text-primary mb-3">Recent Notes</h3>
          
          {recentNotes.length > 0 ? (
            <div className="space-y-3 mb-4">
              {recentNotes.map((note) => (
                <div key={note.id} onClick={() => navigate(`/notes/${note.id}`)} className="bg-bg-surface border border-border rounded-xl p-4 hover:bg-bg-hover cursor-pointer transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-medium text-gold">
                      {note.book} {note.chapter}{note.verse ? `:${note.verse}` : ''}
                    </span>
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
          
          <button
            onClick={() => navigate('/notes')}
            className="text-[13px] text-gold hover:underline font-medium"
          >
            View all notes →
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
