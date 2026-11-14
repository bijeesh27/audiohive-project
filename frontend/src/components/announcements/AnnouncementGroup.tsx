import React from 'react';
import { Calendar } from 'lucide-react';

interface AnnouncementGroupProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

export const AnnouncementGroup: React.FC<AnnouncementGroupProps> = ({
  title,
  count,
  children,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1 pt-2">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full">
          {count}
        </span>
      </div>

      <div className="space-y-2.5">
        {children}
      </div>
    </div>
  );
};

