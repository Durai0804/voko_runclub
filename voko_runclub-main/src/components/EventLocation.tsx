import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface EventLocationProps {
  address: string;
  onGetDirections: () => void;
}

export const EventLocation: React.FC<EventLocationProps> = ({
  address,
  onGetDirections
}) => {
  const encodedAddress = encodeURIComponent(address);
  return (
    <section className="flex flex-col items-start gap-8 self-stretch relative">
      <div className="flex flex-col items-start gap-5 self-stretch relative w-full">
        <hr className="h-[2px] self-stretch relative bg-[var(--voko-text)]/10 border-0" />
        <h2 className="self-stretch text-[var(--voko-text)] text-[11px] font-black uppercase tracking-[0.6em] relative opacity-40">
          LOCATION SECTOR
        </h2>
      </div>
      <div className="flex flex-col gap-6 self-stretch relative">
        <address className="self-stretch text-[var(--voko-text)] text-[24px] font-bold leading-tight tracking-tight relative not-italic">
          {address}
        </address>
        <button
          onClick={() => window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank')}
          className="text-[var(--voko-accent)] text-[11px] font-black uppercase tracking-[0.3em] relative bg-[var(--voko-text)]/5 px-6 py-3 rounded-full border border-[var(--voko-accent)]/20 hover:bg-[var(--voko-accent)] hover:text-black transition-all flex items-center gap-3 w-fit no-underline"
        >
          <ArrowUpRight size={14} />
          INITIATE SEARCH
        </button>
      </div>
      <div className="w-full h-[350px] rounded-[40px] overflow-hidden border border-[var(--voko-text)]/10 relative shadow-2xl bg-[var(--voko-bg)]">
        <iframe
          src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
          className="h-full w-full border-0 rounded-[40px]"
          loading="lazy"
          title="Event location map"
        />
      </div>
    </section>
  );
};
