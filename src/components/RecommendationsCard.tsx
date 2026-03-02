import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VerseRecommendation } from '../lib/recommendations';
import { SkeletonLine } from './Skeleton';

interface RecommendationsCardProps {
  recommendations: VerseRecommendation[];
  loading?: boolean;
}

export default function RecommendationsCard({ recommendations, loading }: RecommendationsCardProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-bg-surface border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-gold" />
          <h3 className="text-[16px] font-bold text-text-primary">Recommended for You</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <SkeletonLine width="30%" />
              <SkeletonLine width="100%" />
              <SkeletonLine width="60%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const handleVerseClick = (rec: VerseRecommendation) => {
    navigate(`/bible/${rec.book}/${rec.chapter}?verse=${rec.verse}`);
  };

  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-5 mb-4 border-l-[3px] border-l-gold">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-gold" />
        <h3 className="text-[16px] font-bold text-text-primary">Recommended for You</h3>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <button
            key={rec.ref}
            onClick={() => handleVerseClick(rec)}
            className="w-full text-left hover:bg-bg-hover rounded-xl p-3 -m-3 transition-colors cursor-pointer"
          >
            <p className="text-[13px] font-medium text-gold mb-1">{rec.ref}</p>
            <p className="text-[14px] text-text-secondary italic leading-relaxed mb-2 line-clamp-2">
              "{rec.text}"
            </p>
            <p className="text-[12px] text-text-muted">{rec.reason}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
