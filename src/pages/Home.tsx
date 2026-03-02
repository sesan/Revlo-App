import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PenTool, Search, LogOut, Flame, Calendar, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import SetupChecklist from '../components/SetupChecklist';
import RecommendationsCard from '../components/RecommendationsCard';
import StatisticsDashboard from '../components/StatisticsDashboard';
import MotivationalBanner from '../components/MotivationalBanner';
import { SkeletonCard } from '../components/Skeleton';
import { useScrollDirection } from '../hooks/useScrollDirection';
import BottomSheet from '../components/BottomSheet';
import { format, getDayOfYear, isSameDay, subDays } from 'date-fns';
import { parseOnboardingAnswers } from '../lib/utils';
import { getPersonalizedRecommendations, VerseRecommendation } from '../lib/recommendations';
import { getMotivationalMessage, getDynamicSubtitle } from '../lib/motivationalMessages';

const VERSES_OF_THE_DAY = [
  { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', book: 'John', chapter: '3', verse: 16 },
  { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.', book: 'Psalms', chapter: '23', verse: 1 },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.', book: 'Philippians', chapter: '4', verse: 13 },
  { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.', book: 'Jeremiah', chapter: '29', verse: 11 },
  { ref: 'Proverbs 3:5', text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.', book: 'Proverbs', chapter: '3', verse: 5 },
  { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', book: 'Romans', chapter: '8', verse: 28 },
  { ref: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.', book: 'Isaiah', chapter: '41', verse: 10 },
  { ref: 'Psalm 46:10', text: 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.', book: 'Psalms', chapter: '46', verse: 10 },
  { ref: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', book: 'Matthew', chapter: '11', verse: 28 },
  { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.', book: 'Psalms', chapter: '119', verse: 105 },
  { ref: 'Romans 12:2', text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.', book: 'Romans', chapter: '12', verse: 2 },
  { ref: 'Psalm 37:4', text: 'Delight thyself also in the Lord: and he shall give thee the desires of thine heart.', book: 'Psalms', chapter: '37', verse: 4 },
  { ref: 'Ephesians 2:8', text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.', book: 'Ephesians', chapter: '2', verse: 8 },
  { ref: '2 Timothy 1:7', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', book: '2 Timothy', chapter: '1', verse: 7 },
  { ref: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', book: 'Hebrews', chapter: '11', verse: 1 },
  { ref: 'Joshua 1:9', text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.', book: 'Joshua', chapter: '1', verse: 9 },
  { ref: 'Psalm 27:1', text: 'The Lord is my light and my salvation; whom shall I fear? The Lord is the strength of my life; of whom shall I be afraid?', book: 'Psalms', chapter: '27', verse: 1 },
  { ref: '1 Corinthians 13:4', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.', book: '1 Corinthians', chapter: '13', verse: 4 },
  { ref: 'Galatians 5:22', text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.', book: 'Galatians', chapter: '5', verse: 22 },
  { ref: 'Colossians 3:23', text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.', book: 'Colossians', chapter: '3', verse: 23 },
  { ref: 'Psalm 139:14', text: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.', book: 'Psalms', chapter: '139', verse: 14 },
  { ref: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.', book: 'Matthew', chapter: '6', verse: 33 },
  { ref: 'Isaiah 40:31', text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.', book: 'Isaiah', chapter: '40', verse: 31 },
  { ref: 'Psalm 34:8', text: 'O taste and see that the Lord is good: blessed is the man that trusteth in him.', book: 'Psalms', chapter: '34', verse: 8 },
  { ref: 'Romans 15:13', text: 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.', book: 'Romans', chapter: '15', verse: 13 },
  { ref: 'Lamentations 3:22-23', text: 'It is of the Lord\'s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.', book: 'Lamentations', chapter: '3', verse: 22 },
  { ref: 'Philippians 4:6', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.', book: 'Philippians', chapter: '4', verse: 6 },
  { ref: 'Psalm 91:1', text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.', book: 'Psalms', chapter: '91', verse: 1 },
  { ref: 'Matthew 5:16', text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.', book: 'Matthew', chapter: '5', verse: 16 },
  { ref: 'Micah 6:8', text: 'He hath shewed thee, O man, what is good; and what doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?', book: 'Micah', chapter: '6', verse: 8 },
];

export default function Home() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection();
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [hasActivityToday, setHasActivityToday] = useState(false);
  const [lastActivityDate, setLastActivityDate] = useState<Date | null>(null);
  const [recommendations, setRecommendations] = useState<VerseRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  const todayVerse = VERSES_OF_THE_DAY[getDayOfYear(new Date()) % VERSES_OF_THE_DAY.length];

  // Parse onboarding answers
  const { purpose, experience, interests } = useMemo(() => {
    return parseOnboardingAnswers(profile?.onboarding_answers);
  }, [profile?.onboarding_answers]);

  // Calculate streak and fetch notes functions (must be before useEffect that uses them)
  const calculateStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch dates of recent activity (notes, highlights, journal)
      // For simplicity, we'll just check notes for now as a proxy for activity
      const { data: notesData } = await supabase
        .from('notes')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!notesData || notesData.length === 0) {
        setStreak(0);
        setHasActivityToday(false);
        setLastActivityDate(null);
        return;
      }

      const dates = notesData.map(n => new Date(n.created_at));
      let currentStreak = 0;
      let checkDate = new Date();

      // Set last activity date
      if (dates.length > 0) {
        setLastActivityDate(dates[0]);
      }

      // Check if there's activity today
      const activityToday = dates.some(d => isSameDay(d, checkDate));
      setHasActivityToday(activityToday);

      if (activityToday) {
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
  }, [user?.id]);

  const fetchRecentNotes = useCallback(async () => {
    if (!user?.id) return;

    try {
      setNotesLoading(true);
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setNotesLoading(false);
    }
  }, [user?.id]);

  // Generate personalized recommendations
  // Use JSON.stringify to prevent infinite loops from array reference changes
  const interestsKey = JSON.stringify(interests);

  useEffect(() => {
    if (profile && interests.length > 0) {
      try {
        setRecommendationsLoading(true);
        const recs = getPersonalizedRecommendations({
          purpose,
          experience,
          interests,
          currentPlan: profile.current_plan,
        });
        setRecommendations(recs);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    } else {
      setRecommendationsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, purpose, experience, interestsKey]);

  // Get motivational message
  const motivationalMessage = useMemo(() => {
    if (!profile) return null;

    return getMotivationalMessage({
      purpose,
      streak,
      hasActivityToday,
      lastActivityDate,
    });
  }, [profile?.id, purpose, streak, hasActivityToday, lastActivityDate]);

  // Get dynamic subtitle for greeting
  const greetingSubtitle = useMemo(() => {
    return getDynamicSubtitle({
      purpose,
      streak,
      hasActivityToday,
    });
  }, [purpose, streak, hasActivityToday]);

  useEffect(() => {
    if (user) {
      fetchRecentNotes();
      calculateStreak();
    }
  }, [user, fetchRecentNotes, calculateStreak]);

  // Auto-prompt for name if profile is incomplete
  useEffect(() => {
    if (profile && !profile.full_name && !showNamePrompt) {
      // Wait a moment for UI to load, then show prompt
      const timer = setTimeout(() => {
        setShowNamePrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [profile, showNamePrompt]);

  const triggerNamePrompt = () => setShowNamePrompt(true);

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameSaving) return;

    setNameSaving(true);
    setNameError('');

    try {
      console.log('Saving name:', nameInput.trim(), 'for user:', user?.id);

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .maybeSingle();

      console.log('Existing profile check:', { existingProfile, checkError });

      if (checkError) throw checkError;

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user?.id,
            email: user?.email,
            full_name: nameInput.trim()
          }]);

        if (insertError) throw insertError;
        console.log('Profile created with name and email');
      } else {
        // Update existing profile (include email in case it's missing)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: user?.email || existingProfile.email,
            full_name: nameInput.trim()
          })
          .eq('id', user?.id);

        if (updateError) throw updateError;
        console.log('Profile name and email updated');
      }

      // Success - close modal and refresh
      setShowNamePrompt(false);
      setNameInput('');
      console.log('Name saved successfully, refreshing profile...');

      // Refresh profile to update UI
      await refreshProfile();
    } catch (err: any) {
      console.error('Error saving name:', err);
      setNameError(err.message || 'Failed to save name. Please try again.');
    } finally {
      setNameSaving(false);
    }
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
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
      <div className="w-full max-w-[760px] px-4 sm:px-6 py-5 space-y-6">
        <div className="flex justify-between items-center relative">
          <h1 className="text-[22px] font-bold tracking-tighter text-text-primary">Verse</h1>

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

        <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0f0f0f] via-[#202020] to-[#303030] text-white shadow-[0_24px_70px_-35px_rgba(0,0,0,0.5)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/75 mb-2">Daily Walk</p>
          <h2 className="text-[30px] sm:text-[36px] leading-[1.05] font-bold tracking-tighter mb-2">{getGreeting()}</h2>
          <p className="text-[14px] text-white/80 max-w-[520px]">{greetingSubtitle}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-medium">
              <Flame size={14} /> {streak} day streak
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-medium">
              <Calendar size={14} /> Day {profile?.current_day || 1} of 7
            </span>
          </div>

          <button
            onClick={() => navigate('/bible')}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-[#121212] px-5 py-2.5 text-[14px] font-semibold hover:bg-white/90 transition-colors"
          >
            Continue Reading <ChevronRight size={16} />
          </button>
        </section>

        {motivationalMessage && <MotivationalBanner message={motivationalMessage} />}

        <AnimatePresence>
          <SetupChecklist
            profile={profile}
            user={user}
            onNavigate={navigate}
            onNamePrompt={triggerNamePrompt}
          />
        </AnimatePresence>

        {/* Recommendations Card */}
        <RecommendationsCard
          recommendations={recommendations}
          loading={recommendationsLoading}
        />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[17px] font-bold tracking-tight text-text-primary">Bible Tools</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => navigate(`/bible/${todayVerse.book}/${todayVerse.chapter}?verse=${todayVerse.verse}`)}
              className="min-w-[190px] rounded-2xl border border-border bg-bg-surface p-4 text-left hover:border-gold transition-colors"
            >
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted mb-2">Verse of the Day</p>
              <p className="text-[14px] font-medium text-text-primary line-clamp-2 mb-1">{todayVerse.ref}</p>
              <p className="text-[12px] text-text-secondary line-clamp-2">"{todayVerse.text}"</p>
            </button>
            <button
              onClick={() => navigate('/bible')}
              className="min-w-[160px] rounded-2xl border border-border bg-bg-surface p-4 text-left hover:border-gold transition-colors"
            >
              <BookOpen size={16} className="mb-2 text-gold" />
              <p className="text-[14px] font-semibold text-text-primary">Bible Reader</p>
              <p className="text-[12px] text-text-secondary">Jump into your chapter.</p>
            </button>
            <button
              onClick={() => navigate('/journal')}
              className="min-w-[160px] rounded-2xl border border-border bg-bg-surface p-4 text-left hover:border-gold transition-colors"
            >
              <PenTool size={16} className="mb-2 text-gold" />
              <p className="text-[14px] font-semibold text-text-primary">Journal Mode</p>
              <p className="text-[12px] text-text-secondary">Capture your reflection.</p>
            </button>
            <button
              onClick={() => navigate('/notes')}
              className="min-w-[160px] rounded-2xl border border-border bg-bg-surface p-4 text-left hover:border-gold transition-colors"
            >
              <Search size={16} className="mb-2 text-gold" />
              <p className="text-[14px] font-semibold text-text-primary">Search Notes</p>
              <p className="text-[12px] text-text-secondary">Find saved insights fast.</p>
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[17px] font-bold tracking-tight text-text-primary">Recommended Scripture</h3>
          </div>
          {recommendationsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {recommendations.map((rec) => (
                <button
                  key={rec.ref}
                  onClick={() => navigate(`/bible/${rec.book}/${rec.chapter}?verse=${rec.verse}`)}
                  className="min-w-[240px] max-w-[260px] rounded-2xl border border-border bg-bg-surface p-4 text-left hover:border-gold transition-colors"
                >
                  <p className="text-[12px] font-semibold text-gold mb-2">{rec.ref}</p>
                  <p className="text-[13px] italic text-text-secondary line-clamp-4 mb-3">"{rec.text}"</p>
                  <p className="text-[12px] text-text-muted">{rec.reason}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-bg-surface border border-border rounded-2xl p-4">
              <p className="text-[13px] text-text-secondary">Complete onboarding to unlock personalized verse rails.</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-bg-surface p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.11em] text-text-muted mb-1">Continue Plan</p>
              <h3 className="text-[20px] font-bold tracking-tight text-text-primary">{profile?.current_plan || 'The Story of Jesus'}</h3>
              <p className="text-[13px] text-text-secondary">Day {profile?.current_day || 1} • Keep momentum</p>
            </div>
            <button
              onClick={() => navigate('/bible')}
              className="w-10 h-10 rounded-full bg-bg-hover border border-border flex items-center justify-center text-text-primary hover:bg-gold hover:text-white hover:border-gold transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-text-primary rounded-full transition-all duration-500"
              style={{ width: `${((profile?.current_day || 1) / 7) * 100}%` }}
            />
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[17px] font-bold tracking-tight text-text-primary">Recent Reflections</h3>
            <button
              onClick={() => navigate('/notes')}
              className="text-[13px] text-gold hover:underline font-medium"
            >
              View all
            </button>
          </div>

          {notesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : recentNotes.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {recentNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => note.book && note.chapter ? navigate(`/bible/${note.book}/${note.chapter}${note.verse ? `?verse=${note.verse}` : ''}`) : undefined}
                  className="min-w-[240px] max-w-[260px] text-left bg-bg-surface border border-border rounded-2xl p-4 hover:border-gold transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-semibold text-gold">
                      {note.book} {note.chapter}{note.verse ? `:${note.verse}` : ''}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getTypeColor(note.type)}`}>
                      {note.type}
                    </span>
                  </div>
                  <p className="text-[13px] text-text-secondary line-clamp-3 mb-3">
                    {note.content || 'No preview available'}
                  </p>
                  <p className="text-[11px] text-text-muted">{format(new Date(note.created_at), 'MMM d')}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-bg-surface border border-border rounded-xl p-6 text-center">
              <p className="text-[14px] text-text-secondary mb-2">No notes yet.</p>
              <p className="text-[13px] text-text-muted">Start reading to add highlights and notes.</p>
            </div>
          )}
        </section>

        {user && (
          <StatisticsDashboard
            userId={user.id}
            currentDay={profile?.current_day || 1}
          />
        )}
      </div>

      <BottomNav hidden={scrollDirection === 'down'} />

      {/* Name Prompt Bottom Sheet */}
      <BottomSheet isOpen={showNamePrompt} onClose={() => {}} dragToDismiss={false}>
        <div className="px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <h3 className="text-[20px] font-bold tracking-tighter text-text-primary mb-2">Welcome to Verse</h3>
          <p className="text-[14px] text-text-secondary mb-4">What should we call you?</p>

          <input
            type="text"
            placeholder="Your First Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={handleNameKeyPress}
            className="w-full bg-bg-input border border-border rounded-xl p-3 text-[15px] text-text-primary focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold mb-4"
            autoFocus
            disabled={nameSaving}
          />

          {nameError && (
            <p className="text-[13px] text-error mb-3">{nameError}</p>
          )}

          <button
            onClick={handleSaveName}
            disabled={!nameInput.trim() || nameSaving}
            className="btn-primary w-full"
          >
            {nameSaving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
