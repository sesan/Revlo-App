import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function OnboardingResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [plan, setPlan] = useState({ name: '', description: '', day1: '' });

  useEffect(() => {
    const topic = location.state?.topic || "Who is Jesus?";
    
    if (topic === "How do I pray?") {
      setPlan({
        name: "Learning to Talk to God",
        description: "7 days of scripture and reflection to build a real prayer life.",
        day1: "Matthew 6:5-15"
      });
    } else if (topic === "Finding peace and comfort") {
      setPlan({
        name: "Held by Peace",
        description: "7 passages for when life feels overwhelming. You are not alone.",
        day1: "Psalm 23"
      });
    } else if (topic === "Understanding God's purpose for my life") {
      setPlan({
        name: "Made with Purpose",
        description: "Explore who God says you are and why you are here.",
        day1: "Jeremiah 29:11-14"
      });
    } else if (topic === "Love, relationships, and family") {
      setPlan({
        name: "Love as Scripture Defines It",
        description: "7 days exploring what the Bible says about love, commitment, and family.",
        day1: "1 Corinthians 13"
      });
    } else if (topic === "Overcoming fear and anxiety") {
      setPlan({
        name: "Fear Not",
        description: "7 powerful scriptures for anxiety, fear, and uncertainty.",
        day1: "Isaiah 41:10"
      });
    } else {
      setPlan({
        name: "The Story of Jesus",
        description: "A 7-day journey through the life, words, and resurrection of Jesus Christ.",
        day1: "John 1:1-18"
      });
    }
  }, [location.state]);

  const handleStartReading = () => {
    // Navigate to Bible reader with the specific passage
    const [book, chapter] = plan.day1.split(' ');
    navigate(`/bible/${book}/${chapter.split(':')[0]}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="mb-8 animate-in fade-in zoom-in duration-500">
        <CheckCircle2 size={48} className="text-gold mx-auto" />
      </div>

      <h1 className="text-[32px] font-bold tracking-tighter text-text-primary mb-2">Your plan is ready.</h1>
      <h2 className="text-[22px] font-bold tracking-tighter text-gold mb-4">{plan.name}</h2>
      <p className="text-[15px] text-text-secondary mb-10 max-w-[300px]">
        {plan.description}
      </p>

      <div className="w-full bg-bg-surface border border-border rounded-xl p-5 mb-10 text-left border-l-[3px] border-l-gold relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>
        <p className="text-[13px] text-text-muted uppercase tracking-wider mb-1">
          Day 1 · Start here
        </p>
        <p className="text-[16px] text-text-primary font-medium">
          {plan.day1}
        </p>
      </div>

      <button
        onClick={handleStartReading}
        className="btn-primary w-full mb-4"
      >
        Start Reading Day 1 →
      </button>

      <button
        onClick={() => navigate('/home')}
        className="text-[15px] text-gold hover:underline"
      >
        Go to my dashboard
      </button>
    </div>
  );
}
