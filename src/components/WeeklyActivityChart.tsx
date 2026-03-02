import { useState } from 'react';

interface WeeklyActivityChartProps {
  weeklyActivity: Array<{ day: string; count: number }>;
}

export default function WeeklyActivityChart({ weeklyActivity }: WeeklyActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (weeklyActivity.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-[14px] text-text-muted">No activity data yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...weeklyActivity.map(d => d.count), 1);

  return (
    <div className="relative">
      <p className="text-[12px] text-text-muted mb-3">Last 7 Days</p>
      <div className="flex items-end justify-between gap-2 h-[120px]">
        {weeklyActivity.map((day, index) => {
          const heightPercent = (day.count / maxCount) * 100;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-2 relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Hover tooltip */}
              {isHovered && day.count > 0 && (
                <div className="absolute -top-8 bg-text-primary text-text-inverse text-[11px] px-2 py-1 rounded whitespace-nowrap">
                  {day.count} {day.count === 1 ? 'activity' : 'activities'}
                </div>
              )}

              {/* Bar */}
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className={`w-2 rounded-t transition-all duration-300 ${
                    day.count > 0
                      ? 'bg-gradient-to-t from-gold to-gold-hover'
                      : 'bg-bg-hover'
                  }`}
                  style={{ height: day.count > 0 ? `${Math.max(heightPercent, 8)}%` : '8px' }}
                />
              </div>

              {/* Day label */}
              <p className="text-[11px] text-text-muted font-medium">{day.day[0]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
