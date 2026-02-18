import React from 'react';
interface EventDescriptionProps {
  description: string;
}
export const EventDescription: React.FC<EventDescriptionProps> = ({
  description
}) => {
  return <section className="flex flex-col items-start gap-4 self-stretch relative">
    <div className="flex flex-col items-start gap-5 self-stretch relative my-0 w-full">
      <hr className="h-px self-stretch relative bg-current opacity-20 border-0" />
      <h2 className="self-stretch text-current text-[11px] font-black uppercase tracking-[0.4em] relative opacity-40">
        ABOUT THIS EVENT
      </h2>
    </div>
    <p className="self-stretch text-current font-normal leading-[1.4] relative opacity-90">
      {description}
    </p>
  </section>;
};