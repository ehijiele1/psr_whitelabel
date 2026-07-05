import React from 'react';
import { GlassCard } from './GlassCard';

interface CardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, icon, children }) => {
  return (
    <GlassCard>
      <h2 className="text-[13px] font-semibold flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <i className={`ti ${icon} text-blue-500`} /> {title}
      </h2>
      {children}
    </GlassCard>
  );
};