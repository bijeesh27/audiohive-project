import React from 'react';
import { formatDateSeparator } from './chatUtils';

interface DateSeparatorProps {
  date: string | Date;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const formatted = formatDateSeparator(date);

  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative px-3 bg-[#F8F9FB] rounded-full">
        <span className="text-xs font-medium text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
          {formatted}
        </span>
      </div>
    </div>
  );
};

