import React from 'react';

interface EventHeaderProps {
  title: string;
  creator: string;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ title, creator }) => {
  return (
    <div className="flex flex-col items-start gap-4 self-stretch relative">
      <header>
        <h1 className="self-stretch text-current text-[56px] font-black leading-[0.9] tracking-[-0.05em] relative max-md:text-[42px] uppercase">
          {title}
        </h1>
      </header>
      <div className="self-stretch text-current text-[11px] font-black uppercase tracking-[0.5em] relative opacity-40">
        CURATED BY {creator}
      </div>
    </div>
  );
};
