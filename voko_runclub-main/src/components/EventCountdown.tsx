import React, { useState, useEffect } from 'react';
import { RotatingBadge } from './RotatingBadge';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface EventCountdownProps {
  targetDate?: Date;
}

export const EventCountdown: React.FC<EventCountdownProps> = ({
  targetDate = new Date(Date.now() + 132 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 51 * 60 * 1000 + 2 * 1000)
}) => {
  const calculateTimeLeft = (target: Date): TimeLeft => {
    const now = new Date().getTime();
    const distance = target.getTime() - now;

    if (distance > 0) {
      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(distance % (1000 * 60 * 60 * 24) / (1000 * 60 * 60)),
        minutes: Math.floor(distance % (1000 * 60 * 60) / (1000 * 60)),
        seconds: Math.floor(distance % (1000 * 60) / 1000)
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const getEventStatus = () => {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const distance = target - now;
    const oneHour = 1000 * 60 * 60;

    if (distance < -oneHour) return 'ended';
    if (distance >= -oneHour && distance <= oneHour) return 'happening';
    return 'upcoming';
  };

  const status = getEventStatus();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const formatValue = (value: number) => value.toString().padStart(2, '0');

  if (status === 'ended') {
    return (
      <div className="flex items-center gap-3 px-6 py-3 bg-[var(--voko-text)]/5 border border-[var(--voko-text)]/10 rounded-full">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--voko-text)]/60">ACCESS TERMINATED</span>
      </div>
    );
  }

  if (status === 'happening') {
    return (
      <div className="flex items-center gap-4 bg-[var(--voko-accent)] px-6 py-2 rounded-full animate-pulse shadow-[0_0_30px_var(--voko-accent)]">
        <div className="w-2 h-2 bg-black rounded-full"></div>
        <span className="text-black font-black uppercase italic tracking-widest text-sm">ENCOUNTER IN PROGRESS</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 md:gap-6">
      {[
        { label: 'D', value: timeLeft.days },
        { label: 'H', value: timeLeft.hours },
        { label: 'M', value: timeLeft.minutes },
        { label: 'S', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={item.label} className="flex flex-col items-center gap-1 group">
          <div className="flex justify-center items-center relative py-1 px-1">
            <span className="text-[var(--voko-text)] text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter group-hover:text-[var(--voko-accent)] transition-colors duration-500">
              {item.label === 'D' ? item.value : formatValue(item.value)}
            </span>
            <span className="text-[10px] font-black text-[var(--voko-accent)] absolute -top-1 -right-4 italic opacity-0 group-hover:opacity-100 transition-opacity">
              {item.label}
            </span>
          </div>
          <div className="w-full h-[1px] bg-[var(--voko-text)]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        </div>
      ))}
    </div>
  );
};