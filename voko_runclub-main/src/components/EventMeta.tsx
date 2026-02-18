import React from 'react';

interface EventMetaProps {
  date: string;
  time: string;
}

export const EventMeta: React.FC<EventMetaProps> = ({ date, time }) => {
  return (
    <div className="flex items-start gap-4 relative">
      <div className="flex justify-center items-center gap-2.5 relative bg-[var(--voko-accent)] px-3 py-1 rounded-full">
        <time className="text-black text-[10px] font-black uppercase tracking-widest relative">
          {date}
        </time>
      </div>
      <div className="flex justify-center items-center gap-2.5 border relative px-3 py-1 rounded-full border-solid border-[var(--voko-text)]/20">
        <time className="text-[var(--voko-text)] text-[10px] font-black uppercase tracking-widest relative">
          {time}
        </time>
      </div>
    </div>
  );
};
